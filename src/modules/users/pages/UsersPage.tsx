import { Check, MagnifyingGlass, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import Button from "../../../components/Button";
import EmptyState from "../../../components/EmptyState";
import ErrorMessage from "../../../components/ErrorMessage";
import PageLoader from "../../../components/PageLoader";
import type { Role } from "../../../types/role";
import { useAuth } from "../../auth/hooks/useAuth";
import { getGlobalRoles } from "../../dashboard/services/applicationsService";
import {
    assignAppRole,
    listAppRoles,
    listApps,
    unassignAppRole,
    type App,
    type AppRole,
} from "../../apps/services/appRegistryService";
import {
    getUserAppRoles,
    getUserGlobalRoles,
    grantRole,
    listUsers,
    revokeRole,
    updateUserStatus,
    type AdminUser,
} from "../services/userService";
import styles from "./UsersPage.module.css";

interface AppPermission {
    app: App;
    roles: AppRole[];
}

function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [globalRoles, setGlobalRoles] = useState<Role[]>([]);
    const [appPermissions, setAppPermissions] = useState<AppPermission[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [assignedGlobalRoleIds, setAssignedGlobalRoleIds] = useState<Set<string>>(new Set());
    const [assignedAppRoleIds, setAssignedAppRoleIds] = useState<Set<string>>(new Set());
    const [loadedPermissionsUserId, setLoadedPermissionsUserId] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadWorkspace() {
            setLoading(true);
            setError(null);
            try {
                const [loadedUsers, loadedGlobalRoles, apps] = await Promise.all([
                    listUsers({ limit: 250, offset: 0 }),
                    getGlobalRoles(),
                    listApps({ limit: 250, offset: 0 }),
                ]);
                const permissions = await Promise.all(
                    apps.map(async (app) => ({
                        app,
                        roles: await listAppRoles(app.client_id).catch(() => []),
                    })),
                );

                if (cancelled) return;
                setUsers(loadedUsers);
                setGlobalRoles(loadedGlobalRoles);
                setAppPermissions(permissions);
                setSelectedId((current) => current && loadedUsers.some((user) => user.id === current) ? current : loadedUsers[0]?.id ?? null);
            } catch (cause) {
                if (!cancelled) setError(cause instanceof Error ? cause.message : "No se pudo cargar la administración de usuarios.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void loadWorkspace();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!selectedId) {
            return;
        }

        let cancelled = false;
        Promise.all([getUserGlobalRoles(selectedId), getUserAppRoles(selectedId)])
            .then(([roles, appRoles]) => {
                if (cancelled) return;
                setAssignedGlobalRoleIds(new Set(roles.map((role) => role.id)));
                setAssignedAppRoleIds(new Set(appRoles.map((role) => role.role_id)));
                setLoadedPermissionsUserId(selectedId);
            })
            .catch((cause) => {
                if (!cancelled) setError(cause instanceof Error ? cause.message : "No se pudieron cargar los permisos del usuario.");
            });

        return () => { cancelled = true; };
    }, [selectedId]);

    const selectedUser = users.find((user) => user.id === selectedId) ?? null;
    const permissionsLoading = selectedUser !== null && loadedPermissionsUserId !== selectedUser.id;
    const filteredUsers = useMemo(
        () => users.filter((user) => `${user.full_name} ${user.email}`.toLowerCase().includes(query.trim().toLowerCase())),
        [query, users],
    );

    async function toggleStatus() {
        if (!selectedUser || selectedUser.id === currentUser?.id) return;
        setBusy(true);
        setError(null);
        try {
            const updated = await updateUserStatus(selectedUser.id, !selectedUser.is_active);
            setUsers((items) => items.map((item) => item.id === updated.id ? updated : item));
            setNotice(updated.is_active ? "Usuario activado." : "Usuario desactivado.");
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "No se pudo actualizar el estado del usuario.");
        } finally {
            setBusy(false);
        }
    }

    async function toggleGlobalRole(role: Role) {
        if (!selectedUser) return;
        const assigned = assignedGlobalRoleIds.has(role.id);
        setBusy(true);
        setError(null);
        try {
            if (assigned) await revokeRole(selectedUser.id, role.id);
            else await grantRole(selectedUser.id, role.id);

            setAssignedGlobalRoleIds((current) => {
                const next = new Set(current);
                if (assigned) next.delete(role.id);
                else next.add(role.id);
                return next;
            });
            setNotice(assigned ? `Rol ${role.name} retirado.` : `Rol ${role.name} asignado.`);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "No se pudo actualizar el rol global.");
        } finally {
            setBusy(false);
        }
    }

    async function toggleAppRole(permission: AppPermission, role: AppRole) {
        if (!selectedUser) return;
        const assigned = assignedAppRoleIds.has(role.id);
        setBusy(true);
        setError(null);
        try {
            if (assigned) await unassignAppRole(permission.app.client_id, role.id, selectedUser.id);
            else await assignAppRole(permission.app.client_id, role.id, selectedUser.id);

            setAssignedAppRoleIds((current) => {
                const next = new Set(current);
                if (assigned) next.delete(role.id);
                else next.add(role.id);
                return next;
            });
            setNotice(assigned ? `Rol retirado de ${permission.app.name}.` : `Acceso a ${permission.app.name} otorgado.`);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "No se pudo actualizar el rol de la aplicación.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className={styles.page}>
            <header className={styles.hero}>
                <div>
                    <p className={styles.eyebrow}>Administración</p>
                    <h1>Usuarios y accesos</h1>
                    <p>Gestiona el estado de las cuentas y los permisos que cada persona recibe en Órbita y sus aplicaciones.</p>
                </div>
            </header>

            {notice && (
                <div className={styles.notice} role="status">
                    <Check size={18} weight="bold" />
                    {notice}
                    <button type="button" onClick={() => setNotice(null)} aria-label="Cerrar aviso"><X size={16} /></button>
                </div>
            )}
            {error && <ErrorMessage message={error} />}

            {loading ? <PageLoader message="Cargando usuarios…" /> : users.length === 0 ? (
                <EmptyState title="No hay usuarios" description="Cuando haya cuentas disponibles, podrás administrar sus accesos aquí." />
            ) : (
                <div className={styles.workspace}>
                    <aside className={styles.userList} aria-label="Usuarios">
                        <label className={styles.search}>
                            <MagnifyingGlass size={18} aria-hidden="true" />
                            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar usuario" aria-label="Buscar usuario" />
                        </label>
                        <p className={styles.count}>{filteredUsers.length} usuarios</p>
                        <div className={styles.users}>
                            {filteredUsers.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    className={[styles.userRow, user.id === selectedId ? styles.selected : ""].join(" ")}
                                    onClick={() => setSelectedId(user.id)}
                                >
                                    <span className={styles.avatar} aria-hidden="true">{user.full_name.slice(0, 1).toUpperCase()}</span>
                                    <span className={styles.userIdentity}>
                                        <strong>{user.full_name}</strong>
                                        <small>{user.email}</small>
                                    </span>
                                    <i className={user.is_active ? styles.active : styles.inactive}>{user.is_active ? "Activo" : "Inactivo"}</i>
                                </button>
                            ))}
                        </div>
                    </aside>

                    {selectedUser && (
                        <article className={styles.detail} aria-busy={permissionsLoading}>
                            <div className={styles.personHead}>
                                <span className={styles.largeAvatar} aria-hidden="true">{selectedUser.full_name.slice(0, 1).toUpperCase()}</span>
                                <div>
                                    <h2>{selectedUser.full_name}</h2>
                                    <p>{selectedUser.email}</p>
                                </div>
                                <span className={selectedUser.is_active ? styles.statusOn : styles.statusOff}>
                                    {selectedUser.is_active ? "Activo" : "Inactivo"}
                                </span>
                            </div>

                            <div className={styles.actionBar}>
                                <div>
                                    <strong>Estado de la cuenta</strong>
                                    <span>{selectedUser.is_active ? "Puede iniciar sesión y usar sus aplicaciones." : "No puede iniciar sesión hasta activarla."}</span>
                                </div>
                                <Button type="button" variant="ghost" disabled={busy || selectedUser.id === currentUser?.id} onClick={toggleStatus}>
                                    {selectedUser.id === currentUser?.id ? "Tu cuenta" : selectedUser.is_active ? "Desactivar" : "Activar"}
                                </Button>
                            </div>

                            <div className={styles.permissions}>
                                <div>
                                    <p className={styles.sectionLabel}>Roles de Órbita</p>
                                    <h3>Acceso global</h3>
                                    <p className={styles.hint}>Estos roles habilitan las aplicaciones de catálogo que los requieran.</p>
                                </div>
                                <div className={styles.globalRoles}>
                                    {globalRoles.map((role) => {
                                        const assigned = assignedGlobalRoleIds.has(role.id);
                                        return (
                                            <button
                                                key={role.id}
                                                type="button"
                                                title={role.description ?? role.name}
                                                className={[styles.role, assigned ? styles.roleActive : ""].join(" ")}
                                                disabled={busy || permissionsLoading}
                                                aria-pressed={assigned}
                                                onClick={() => toggleGlobalRole(role)}
                                            >
                                                {assigned && <Check size={14} weight="bold" />}
                                                {role.name}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className={styles.appRolesHeader}>
                                    <p className={styles.sectionLabel}>Permisos por aplicación</p>
                                    <h3>Roles SSO</h3>
                                    <p className={styles.hint}>Asignar un rol habilita la tarjeta en Órbita, el inicio de sesión SSO y los permisos dentro de esa aplicación.</p>
                                </div>

                                {appPermissions.length === 0 ? (
                                    <p className={styles.hint}>Aún no hay aplicaciones SSO registradas.</p>
                                ) : appPermissions.map((permission) => (
                                    <div className={styles.appPermission} key={permission.app.client_id}>
                                        <div>
                                            <strong>{permission.app.name}</strong>
                                            <small>{permission.app.is_active ? "Aplicación activa" : "Aplicación inactiva"}</small>
                                        </div>
                                        <div className={styles.roleChoices}>
                                            {permission.roles.length === 0 ? <span className={styles.noRoles}>Sin roles sincronizados</span> : permission.roles.map((role) => {
                                                const assigned = assignedAppRoleIds.has(role.id);
                                                return (
                                                    <button
                                                        key={role.id}
                                                        type="button"
                                                        title={role.description ?? role.name}
                                                        className={[styles.role, assigned ? styles.roleActive : ""].join(" ")}
                                                        disabled={busy || permissionsLoading || !permission.app.is_active}
                                                        aria-pressed={assigned}
                                                        onClick={() => toggleAppRole(permission, role)}
                                                    >
                                                        {assigned && <Check size={14} weight="bold" />}
                                                        {role.display_name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </article>
                    )}
                </div>
            )}
        </section>
    );
}

export default UsersPage;
