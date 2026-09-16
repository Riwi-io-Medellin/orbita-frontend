import { Check, Copy, MagnifyingGlass, User, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import TextField from "../../../components/TextField";
import EmptyState from "../../../components/EmptyState";
import ErrorMessage from "../../../components/ErrorMessage";
import PageLoader from "../../../components/PageLoader";
import PageHeader from "../../../components/PageHeader";
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
    getUserExternalIdentities,
    getUserGlobalRoles,
    grantRole,
    listUsers,
    revokeRole,
    updateUserStatus,
    createLocalUser,
    type CreatedLocalUser,
    type AdminUser,
    type UserExternalIdentity,
} from "../services/userService";
import styles from "./UsersPage.module.css";
import RoleDropdown from "../../../components/RoleDropdown";

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
    const [externalIdentities, setExternalIdentities] = useState<UserExternalIdentity[]>([]);
    const [loadedPermissionsUserId, setLoadedPermissionsUserId] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [createdUser, setCreatedUser] = useState<CreatedLocalUser | null>(null);
    const [creating, setCreating] = useState(false);
    const [copiedCredential, setCopiedCredential] = useState<"email" | "password" | null>(null);

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
                setSelectedId((current) => loadedUsers.find((user) => user.id === currentUser?.id)?.id
                    ?? (current && loadedUsers.some((user) => user.id === current) ? current : loadedUsers[0]?.id ?? null));
            } catch (cause) {
                if (!cancelled) setError(cause instanceof Error ? cause.message : "No se pudo cargar la administración de usuarios.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void loadWorkspace();
        return () => { cancelled = true; };
    }, [currentUser?.id]);

    useEffect(() => {
        if (!selectedId) {
            return;
        }

        let cancelled = false;
        Promise.all([getUserGlobalRoles(selectedId), getUserAppRoles(selectedId), getUserExternalIdentities(selectedId)])
            .then(([roles, appRoles, identities]) => {
                if (cancelled) return;
                setAssignedGlobalRoleIds(new Set(roles.map((role) => role.id)));
                setAssignedAppRoleIds(new Set(appRoles.map((role) => role.role_id)));
                setExternalIdentities(identities);
                setLoadedPermissionsUserId(selectedId);
            })
            .catch((cause) => {
                if (!cancelled) setError(cause instanceof Error ? cause.message : "No se pudo cargar el detalle del usuario.");
            });

        return () => { cancelled = true; };
    }, [selectedId]);

    const selectedUser = users.find((user) => user.id === selectedId) ?? null;
    const permissionsLoading = selectedUser !== null && loadedPermissionsUserId !== selectedUser.id;
    const selectedGlobalRole = globalRoles.find((role) => assignedGlobalRoleIds.has(role.id));
    const filteredUsers = useMemo(
        () => users.filter((user) => `${user.full_name} ${user.email}`.toLowerCase().includes(query.trim().toLowerCase())),
        [query, users],
    );

    async function submitCreateUser(event: React.FormEvent) {
        event.preventDefault(); setCreating(true); setError(null);
        try {
            const created = await createLocalUser(newName.trim(), newEmail.trim());
            setUsers((items) => [...items, created].sort((a, b) => a.email.localeCompare(b.email)));
            setSelectedId(created.id); setCreatedUser(created); setNewName(""); setNewEmail("");
            setNotice("Usuario creado. Guarda la contraseña temporal antes de cerrar.");
        } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo crear el usuario."); }
        finally { setCreating(false); }
    }

    async function copyCredential(kind: "email" | "password", value: string) {
        try {
            await navigator.clipboard.writeText(value);
            setCopiedCredential(kind);
            window.setTimeout(() => setCopiedCredential((current) => current === kind ? null : current), 1800);
        } catch {
            setError("No se pudo copiar. Selecciona el dato y cópialo manualmente.");
        }
    }

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

    async function changeGlobalRole(roleId: string) {
        if (!selectedUser) return;
        const currentRole = globalRoles.find((role) => assignedGlobalRoleIds.has(role.id));
        const nextRole = globalRoles.find((role) => role.id === roleId);
        if (currentRole?.id === nextRole?.id) return;

        setBusy(true);
        setError(null);
        try {
            if (nextRole) {
                await grantRole(selectedUser.id, nextRole.id);
                setAssignedGlobalRoleIds(new Set([nextRole.id]));
                setNotice(`Rol ${nextRole.name} asignado.`);
            } else if (currentRole && currentRole.name !== "guest") {
                await revokeRole(selectedUser.id, currentRole.id);
                const guestRole = globalRoles.find((role) => role.name === "guest");
                setAssignedGlobalRoleIds(new Set(guestRole ? [guestRole.id] : []));
                setNotice("Rol global retirado.");
            }
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "No se pudo actualizar el rol global.");
        } finally {
            setBusy(false);
        }
    }

    async function changeAppRole(permission: AppPermission, roleId: string) {
        if (!selectedUser) return;
        const currentlyAssigned = permission.roles.filter((role) => assignedAppRoleIds.has(role.id));
        const nextRole = permission.roles.find((role) => role.id === roleId);
        if (currentlyAssigned.length === 1 && currentlyAssigned[0].id === nextRole?.id) return;

        setBusy(true);
        setError(null);
        try {
            await Promise.all(currentlyAssigned.map((role) => unassignAppRole(permission.app.client_id, role.id, selectedUser.id)));
            if (nextRole) await assignAppRole(permission.app.client_id, nextRole.id, selectedUser.id);

            setAssignedAppRoleIds((current) => {
                const next = new Set(current);
                currentlyAssigned.forEach((role) => next.delete(role.id));
                if (nextRole) next.add(nextRole.id);
                return next;
            });
            setNotice(nextRole ? `Acceso a ${permission.app.name} actualizado.` : `Acceso retirado de ${permission.app.name}.`);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "No se pudo actualizar el rol de la aplicación.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className={styles.page}>
            <div className={styles.headerRow}>
                <PageHeader title="Usuarios" description="Administra cuentas y sus accesos a Órbita." />
                <Button type="button" onClick={() => { setCreatedUser(null); setCreateOpen(true); }}>Crear usuario</Button>
            </div>

            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={createdUser ? "Usuario creado" : "Crear usuario de Órbita"}>
                {createdUser ? <div className={styles.temporaryPassword}>
                    <p>Comparte estas credenciales de forma segura. La persona deberá cambiar la contraseña al entrar por primera vez.</p>
                    <dl>
                        <div className={styles.credentialRow}>
                            <dt>Correo</dt>
                            <dd><span>{createdUser.email}</span><button type="button" className={styles.copyButton} onClick={() => void copyCredential("email", createdUser.email)} aria-label="Copiar correo">{copiedCredential === "email" ? <Check size={17} weight="bold" /> : <Copy size={17} weight="bold" />}<span>{copiedCredential === "email" ? "Copiado" : "Copiar"}</span></button></dd>
                        </div>
                        <div className={styles.credentialRow}>
                            <dt>Contraseña temporal</dt>
                            <dd><code>{createdUser.temporary_password}</code><button type="button" className={styles.copyButton} onClick={() => void copyCredential("password", createdUser.temporary_password)} aria-label="Copiar contraseña temporal">{copiedCredential === "password" ? <Check size={17} weight="bold" /> : <Copy size={17} weight="bold" />}<span>{copiedCredential === "password" ? "Copiado" : "Copiar"}</span></button></dd>
                        </div>
                    </dl>
                    <Button type="button" onClick={() => setCreateOpen(false)}>Listo</Button>
                </div> : <form className={styles.createForm} onSubmit={submitCreateUser}>
                    <p className={styles.hint}>Solo crea cuentas locales de Órbita. Moodle y Microsoft se administran desde sus propios proveedores.</p>
                    <TextField id="new-user-name" label="Nombre completo" value={newName} onChange={(event) => setNewName(event.target.value)} required />
                    <TextField id="new-user-email" label="Correo" type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} required />
                    <Button type="submit" loading={creating}>Crear y generar contraseña</Button>
                </form>}
            </Modal>

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
                        <p className={styles.count}>{filteredUsers.length} personas</p>
                        <div className={styles.users}>
                            {filteredUsers.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    className={[styles.userRow, user.id === selectedId ? styles.selected : ""].join(" ")}
                                    onClick={() => setSelectedId(user.id)}
                                >
                                    <span className={styles.avatar} aria-hidden="true"><User size={18} weight="bold" /></span>
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
                                <span className={styles.largeAvatar} aria-hidden="true"><User size={25} weight="bold" /></span>
                                <div>
                                    <h2>{selectedUser.full_name}</h2>
                                    <p>{selectedUser.email}</p>
                                </div>
                                <div className={styles.personActions}>
                                    <span className={selectedUser.is_active ? styles.statusOn : styles.statusOff}>
                                        {selectedUser.is_active ? "Activa" : "Inactiva"}
                                    </span>
                                    <Button type="button" variant="ghost" disabled={busy || selectedUser.id === currentUser?.id} onClick={toggleStatus}>
                                        {selectedUser.id === currentUser?.id ? "Tu cuenta" : selectedUser.is_active ? "Desactivar" : "Activar"}
                                    </Button>
                                </div>
                            </div>

                            {!permissionsLoading && externalIdentities.length > 0 && (
                                <section className={styles.identityProviders} aria-labelledby="identity-providers-title">
                                    <h3 id="identity-providers-title">Inicios de sesión vinculados</h3>
                                    <ul className={styles.providerList}>
                                        {externalIdentities.map((identity) => (
                                            <li key={identity.provider_code}>
                                                <strong>{identity.provider_name}</strong>
                                                <span>{identity.provider_email ?? "Sin correo reportado por el proveedor"}</span>
                                                {identity.last_seen_at && <small>Último acceso: {new Date(identity.last_seen_at).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" })}</small>}
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            <div className={styles.permissions}>
                                <div>
                                    <h3>Rol en Órbita</h3>
                                    <p className={styles.hint}>Elige el acceso global de esta persona.</p>
                                </div>
                                <RoleDropdown
                                    ariaLabel="Rol global"
                                    placeholder="Sin rol de acceso"
                                    options={globalRoles.filter((role) => role.name !== "guest").map((role) => ({ value: role.id, label: role.name }))}
                                    value={selectedGlobalRole?.name === "guest" ? "" : selectedGlobalRole?.id ?? ""}
                                    disabled={busy || permissionsLoading}
                                    onChange={(value) => void changeGlobalRole(value)}
                                />

                                <div className={styles.appRolesHeader}>
                                    <h3>Acceso a aplicaciones</h3>
                                    <p className={styles.hint}>Asigna un rol para habilitar una aplicación.</p>
                                </div>

                                {appPermissions.length === 0 ? (
                                    <p className={styles.hint}>Aún no hay aplicaciones SSO registradas.</p>
                                ) : appPermissions.map((permission) => (
                                    <div className={styles.appPermission} key={permission.app.client_id}>
                                        <div>
                                            <strong>{permission.app.name}</strong>
                                            {!permission.app.is_active && <small>Aplicación inactiva</small>}
                                        </div>
                                        {permission.roles.length === 0 ? <span className={styles.noRoles}>Sin roles disponibles</span> : (
                                            <RoleDropdown
                                                ariaLabel={`Rol en ${permission.app.name}`}
                                                placeholder="Sin rol"
                                                options={permission.roles.map((role) => ({ value: role.id, label: role.display_name }))}
                                                value={permission.roles.find((role) => assignedAppRoleIds.has(role.id))?.id ?? ""}
                                                disabled={busy || permissionsLoading || !permission.app.is_active}
                                                onChange={(value) => void changeAppRole(permission, value)}
                                            />
                                        )}
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
