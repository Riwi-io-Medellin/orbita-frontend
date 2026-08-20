import { useEffect, useState } from "react";
import Banner from "../../../components/Banner";
import Button from "../../../components/Button";
import ErrorMessage from "../../../components/ErrorMessage";
import Modal from "../../../components/Modal";
import PageLoader from "../../../components/PageLoader";
import Select from "../../../components/Select";
import Table from "../../../components/Table";
import type { Role } from "../../../types/role";
import {
    getUserApplications,
    getUserAppRoles,
    grantRole,
    revokeRole,
    type AdminUser,
    type UserApplication,
    type UserAppRole,
} from "../services/userService";
import styles from "./UserDetailModal.module.css";

interface UserDetailModalProps {
    user: AdminUser | null;
    roles: Role[];
    onClose: () => void;
}

interface AppWithRoles {
    application: UserApplication;
    roles: UserAppRole[];
}

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString("es", { year: "numeric", month: "short", day: "numeric" });
}

function UserDetailModal({ user, roles, onClose }: UserDetailModalProps) {
    const [applications, setApplications] = useState<UserApplication[]>([]);
    const [appRoles, setAppRoles] = useState<UserAppRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [globalRoleId, setGlobalRoleId] = useState("");
    const [roleBusy, setRoleBusy] = useState(false);
    const [roleBanner, setRoleBanner] = useState<{ variant: "success" | "error"; message: string } | null>(null);

    async function handleGrantGlobalRole() {
        if (!user || !globalRoleId) return;
        setRoleBusy(true);
        setRoleBanner(null);
        try {
            await grantRole(user.id, globalRoleId);
            setRoleBanner({ variant: "success", message: "Rol asignado." });
        } catch (err) {
            setRoleBanner({ variant: "error", message: err instanceof Error ? err.message : "No se pudo asignar el rol." });
        } finally {
            setRoleBusy(false);
        }
    }

    async function handleRevokeGlobalRole() {
        if (!user || !globalRoleId) return;
        setRoleBusy(true);
        setRoleBanner(null);
        try {
            await revokeRole(user.id, globalRoleId);
            setRoleBanner({ variant: "success", message: "Rol revocado." });
        } catch (err) {
            setRoleBanner({ variant: "error", message: err instanceof Error ? err.message : "No se pudo revocar el rol." });
        } finally {
            setRoleBusy(false);
        }
    }

    useEffect(() => {
        if (!user) return;
        Promise.all([getUserApplications(user.id), getUserAppRoles(user.id)])
            .then(([apps, roles]) => {
                setApplications(apps);
                setAppRoles(roles);
                setError(null);
            })
            .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el detalle del usuario."))
            .finally(() => setLoading(false));
    }, [user]);

    // No shared id between the two endpoints — join by app name (case-insensitive fallback).
    const rows: AppWithRoles[] = applications.map((application) => ({
        application,
        roles: appRoles.filter((role) => role.app_name.toLowerCase() === application.name.toLowerCase()),
    }));

    return (
        <Modal open={user !== null} onClose={onClose} title={user?.full_name ?? "Usuario"}>
            {user && (
                <div className={styles.content}>
                    <div className={styles.summary}>
                        <p className={styles.email}>{user.email}</p>
                        <div className={styles.badges}>
                            <span className={user.is_active ? styles.badgeActive : styles.badgeInactive}>
                                {user.is_active ? "Activo" : "Inactivo"}
                            </span>
                            {user.is_platform_admin && <span className={styles.badgeAdmin}>Admin de plataforma</span>}
                            {user.deleted_at && <span className={styles.badgeDeleted}>Eliminado el {formatDate(user.deleted_at)}</span>}
                        </div>
                        <p className={styles.createdAt}>Creado el {formatDate(user.created_at)}</p>
                    </div>

                    <h3 className={styles.sectionTitle}>Rol global</h3>

                    {roleBanner && <Banner variant={roleBanner.variant} message={roleBanner.message} onDismiss={() => setRoleBanner(null)} />}

                    <div className={styles.roleRow}>
                        <Select
                            id="detail-global-role"
                            label=""
                            aria-label="Rol"
                            placeholder="Rol…"
                            options={roles.map((role) => ({ value: role.id, label: role.name }))}
                            value={globalRoleId}
                            disabled={roleBusy || roles.length === 0}
                            onChange={(event) => setGlobalRoleId(event.target.value)}
                        />
                        <Button type="button" variant="ghost" disabled={roleBusy || !globalRoleId} onClick={handleGrantGlobalRole}>Otorgar</Button>
                        <Button type="button" variant="ghost" disabled={roleBusy || !globalRoleId} onClick={handleRevokeGlobalRole}>Quitar</Button>
                    </div>

                    <h3 className={styles.sectionTitle}>Aplicaciones</h3>

                    {loading ? (
                        <PageLoader message="Cargando aplicaciones…" />
                    ) : error ? (
                        <ErrorMessage message={error} />
                    ) : (
                        <Table
                            columns={[
                                {
                                    key: "app",
                                    header: "Aplicación",
                                    render: (row: AppWithRoles) => (
                                        <div className={styles.appCell}>
                                            {row.application.icon && (
                                                <img src={row.application.icon} alt="" className={styles.appIcon} />
                                            )}
                                            <strong>{row.application.name}</strong>
                                        </div>
                                    ),
                                },
                                {
                                    key: "roles",
                                    header: "Rol",
                                    render: (row: AppWithRoles) =>
                                        row.roles.length === 0 ? (
                                            <span className={styles.noRole}>Sin rol asignado</span>
                                        ) : (
                                            <div className={styles.roleChips}>
                                                {row.roles.map((role) => (
                                                    <span key={role.role_id} className={styles.roleChip}>{role.role_name}</span>
                                                ))}
                                            </div>
                                        ),
                                },
                            ]}
                            rows={rows}
                            getRowId={(row) => row.application.id}
                            emptyState={{ title: "Sin aplicaciones", description: "Este usuario no tiene aplicaciones visibles." }}
                        />
                    )}
                </div>
            )}
        </Modal>
    );
}

export default UserDetailModal;
