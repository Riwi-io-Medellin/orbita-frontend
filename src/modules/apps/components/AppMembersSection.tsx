import { useEffect, useMemo, useState } from "react";
import Banner from "../../../components/Banner";
import Button from "../../../components/Button";
import Checkbox from "../../../components/Checkbox";
import Pagination from "../../../components/Pagination";
import RoleDropdown from "../../../components/RoleDropdown";
import Table from "../../../components/Table";
import {
    assignAppRole,
    bulkAssignAppRole,
    bulkUnassignAppRole,
    groupAppUsersByUser,
    listAppUsers,
    unassignAppRole,
    type App,
    type AppRole,
    type AppRoleAssignmentRow,
    type AppUserWithRoles,
} from "../services/appRegistryService";
import AddUserToAppWizard from "./AddUserToAppWizard";
import RoleAssignmentDropdown from "./RoleAssignmentDropdown";
import styles from "./AppMembersSection.module.css";

const LIMIT = 20;

interface AppMembersSectionProps {
    app: App;
    roles: AppRole[];
}

function AppMembersSection({ app, roles }: AppMembersSectionProps) {
    const [rawRows, setRawRows] = useState<AppRoleAssignmentRow[]>([]);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkRoleId, setBulkRoleId] = useState("");

    const [wizardOpen, setWizardOpen] = useState(false);

    const [banner, setBanner] = useState<{ variant: "success" | "error"; message: string } | null>(null);
    const [busy, setBusy] = useState(false);

    const roleRows = useMemo(() => groupAppUsersByUser(rawRows), [rawRows]);

    useEffect(() => {
        listAppUsers(app.client_id, { limit: LIMIT, offset })
            .then((result) => {
                setRawRows(result);
                setSelected(new Set());
                setError(null);
            })
            .catch(() => setError("No se pudieron cargar los usuarios con rol en esta aplicación."))
            .finally(() => setLoading(false));
    }, [app.client_id, offset]);

    function reload() {
        listAppUsers(app.client_id, { limit: LIMIT, offset })
            .then(setRawRows)
            .catch(() => setError("No se pudieron cargar los usuarios con rol en esta aplicación."))
            .finally(() => setLoading(false));
    }

    function toggleSelected(userId: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    }

    function toggleSelectAll() {
        setSelected((prev) => (prev.size === roleRows.length ? new Set() : new Set(roleRows.map((r) => r.user_id))));
    }

    async function handleBulkAssignRole() {
        if (!bulkRoleId || selected.size === 0) return;
        setBusy(true);
        setBanner(null);
        try {
            const result = await bulkAssignAppRole(app.client_id, bulkRoleId, [...selected]);
            setBanner({ variant: "success", message: `Rol asignado a ${result.updated_user_ids.length} usuarios.` });
            reload();
        } catch (err) {
            setBanner({ variant: "error", message: err instanceof Error ? err.message : "No se pudo asignar el rol." });
        } finally {
            setBusy(false);
        }
    }

    async function handleBulkUnassignRole() {
        if (!bulkRoleId || selected.size === 0) return;
        setBusy(true);
        setBanner(null);
        try {
            const result = await bulkUnassignAppRole(app.client_id, bulkRoleId, [...selected]);
            setBanner({ variant: "success", message: `Rol quitado a ${result.updated_user_ids.length} usuarios.` });
            reload();
        } catch (err) {
            setBanner({ variant: "error", message: err instanceof Error ? err.message : "No se pudo quitar el rol." });
        } finally {
            setBusy(false);
        }
    }

    async function handleRowAssignRole(row: AppUserWithRoles, roleId: string) {
        setBusy(true);
        setBanner(null);
        try {
            await assignAppRole(app.client_id, roleId, row.user_id);
            reload();
        } catch (err) {
            setBanner({ variant: "error", message: err instanceof Error ? err.message : "No se pudo asignar el rol." });
        } finally {
            setBusy(false);
        }
    }

    async function handleRowUnassignRole(row: AppUserWithRoles, roleId: string) {
        setBusy(true);
        setBanner(null);
        try {
            await unassignAppRole(app.client_id, roleId, row.user_id);
            reload();
        } catch (err) {
            setBanner({ variant: "error", message: err instanceof Error ? err.message : "No se pudo quitar el rol." });
        } finally {
            setBusy(false);
        }
    }

    async function handleRowSelectRole(row: AppUserWithRoles, roleId: string) {
        const alreadyAssigned = row.roles.some((role) => role.role_id === roleId);
        if (alreadyAssigned) {
            if (app.role_cardinality === "single") return;
            await handleRowUnassignRole(row, roleId);
            return;
        }

        if (app.role_cardinality === "single" && row.roles.length > 0) {
            setBusy(true);
            setBanner(null);
            try {
                await Promise.all(row.roles.map((role) => unassignAppRole(app.client_id, role.role_id, row.user_id)));
                await assignAppRole(app.client_id, roleId, row.user_id);
                reload();
            } catch (err) {
                setBanner({ variant: "error", message: err instanceof Error ? err.message : "No se pudo cambiar el rol." });
            } finally {
                setBusy(false);
            }
            return;
        }

        await handleRowAssignRole(row, roleId);
    }

    async function handleRowClearRoles(row: AppUserWithRoles) {
        if (row.roles.length === 0) return;
        setBusy(true);
        setBanner(null);
        try {
            await Promise.all(row.roles.map((role) => unassignAppRole(app.client_id, role.role_id, row.user_id)));
            reload();
        } catch (err) {
            setBanner({ variant: "error", message: err instanceof Error ? err.message : "No se pudo retirar el acceso." });
        } finally {
            setBusy(false);
        }
    }

    const roleOptions = roles.map((role) => ({ value: role.id, label: `${role.display_name} (${role.name})` }));

    return (
        <section className={styles.section}>
            <h3>Personas con acceso</h3>
            <p className={styles.hint}>Asigna un rol para habilitar esta aplicación a una persona.</p>

            {banner && <Banner variant={banner.variant} message={banner.message} onDismiss={() => setBanner(null)} />}

            <div className={styles.toolbar}>
                <Button type="button" onClick={() => setWizardOpen(true)}>Asignar acceso</Button>
            </div>

            {selected.size > 0 && (
                <div className={styles.bulkBar}>
                    <span>{selected.size} seleccionados</span>
                    <RoleDropdown
                        ariaLabel="Rol para personas seleccionadas"
                        placeholder="Rol…"
                        options={roleOptions}
                        value={bulkRoleId}
                        onChange={setBulkRoleId}
                    />
                    <Button type="button" variant="ghost" disabled={busy || !bulkRoleId} onClick={handleBulkAssignRole}>Asignar rol</Button>
                    <Button type="button" variant="ghost" disabled={busy || !bulkRoleId} onClick={handleBulkUnassignRole}>Quitar rol</Button>
                </div>
            )}

            <Table
                columns={[
                    {
                        key: "select",
                        header: roleRows.length > 0 ? (
                            <Checkbox checked={selected.size === roleRows.length} onChange={toggleSelectAll} aria-label="Seleccionar todos" />
                        ) : "",
                        render: (row: AppUserWithRoles) => (
                            <Checkbox
                                checked={selected.has(row.user_id)}
                                onChange={() => toggleSelected(row.user_id)}
                                aria-label={`Seleccionar ${row.full_name}`}
                            />
                        ),
                    },
                    { key: "name", header: "Nombre", render: (row: AppUserWithRoles) => <strong>{row.full_name}</strong> },
                    { key: "email", header: "Correo", render: (row: AppUserWithRoles) => row.email },
                    {
                        key: "roles",
                        header: "Roles",
                        render: (row: AppUserWithRoles) => (
                            <RoleAssignmentDropdown
                                userName={row.full_name}
                                roles={roles}
                                assignedRoles={row.roles}
                                singleRole={app.role_cardinality === "single"}
                                disabled={busy}
                                onSelect={(roleId) => void handleRowSelectRole(row, roleId)}
                                onClear={() => void handleRowClearRoles(row)}
                            />
                        ),
                    },
                ]}
                rows={roleRows}
                getRowId={(row) => row.user_id}
                loading={loading}
                loadingMessage="Cargando usuarios…"
                error={error}
                emptyState={{ title: "Sin usuarios con acceso", description: "Asigna un rol para habilitar el acceso a esta aplicación." }}
                className={styles.flatTable}
            />

            <Pagination limit={LIMIT} offset={offset} itemCount={rawRows.length} onPageChange={setOffset} />

            <AddUserToAppWizard app={app} roles={roles} open={wizardOpen} onClose={() => setWizardOpen(false)} onDone={reload} />
        </section>
    );
}

export default AppMembersSection;
