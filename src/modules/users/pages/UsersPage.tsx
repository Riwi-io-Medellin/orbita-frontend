import { useEffect, useState } from "react";
import Banner from "../../../components/Banner";
import Button from "../../../components/Button";
import Checkbox from "../../../components/Checkbox";
import Modal from "../../../components/Modal";
import Pagination from "../../../components/Pagination";
import Select from "../../../components/Select";
import Table from "../../../components/Table";
import TextField from "../../../components/TextField";
import { getGlobalRoles } from "../../dashboard/services/applicationsService";
import { useAuth } from "../../auth/hooks/useAuth";
import UserDetailModal from "../components/UserDetailModal";
import {
    bulkDeleteUsers,
    bulkGrantRole,
    bulkRevokeRole,
    bulkUpdateStatus,
    deleteUser,
    listUsers,
    updateUserStatus,
    type AdminUser,
} from "../services/userService";
import type { Role } from "../../../types/role";
import styles from "./UsersPage.module.css";

const LIMIT = 20;

type ConfirmAction =
    | { kind: "delete-one"; userId: string; userName: string }
    | { kind: "delete-bulk" };

function UsersPage() {
    const { user: currentUser } = useAuth();

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");

    const [roles, setRoles] = useState<Role[]>([]);
    const [bulkRoleId, setBulkRoleId] = useState("");

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [banner, setBanner] = useState<{ variant: "success" | "error"; message: string } | null>(null);
    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
    const [busy, setBusy] = useState(false);
    const [detailUser, setDetailUser] = useState<AdminUser | null>(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setOffset(0);
            setSearch(searchInput.trim());
        }, 400);
        return () => clearTimeout(timeout);
    }, [searchInput]);

    useEffect(() => {
        getGlobalRoles().then(setRoles).catch(() => setRoles([]));
    }, []);

    useEffect(() => {
        listUsers({ limit: LIMIT, offset, search: search || undefined })
            .then((result) => {
                setUsers(result);
                setSelected(new Set());
                setError(null);
            })
            .catch(() => setError("No se pudieron cargar los usuarios."))
            .finally(() => setLoading(false));
    }, [offset, search]);

    function reload() {
        listUsers({ limit: LIMIT, offset, search: search || undefined })
            .then((result) => setUsers(result))
            .catch(() => setError("No se pudieron cargar los usuarios."))
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
        const selectableIds = users.filter((u) => u.id !== currentUser?.id).map((u) => u.id);
        setSelected((prev) => (prev.size === selectableIds.length ? new Set() : new Set(selectableIds)));
    }

    async function runBulk(action: () => Promise<{ not_found_ids: string[] }>, describe: (updatedCount: number) => string) {
        setBusy(true);
        setBanner(null);
        try {
            const result = (await action()) as { updated?: unknown[]; updated_user_ids?: unknown[]; not_found_ids: string[] };
            const updatedCount = (result.updated ?? result.updated_user_ids ?? []).length;
            const missedCount = result.not_found_ids.length;
            setBanner({
                variant: missedCount > 0 ? "error" : "success",
                message: missedCount > 0
                    ? `${describe(updatedCount)} (${missedCount} no encontrados).`
                    : describe(updatedCount),
            });
            reload();
        } catch (err) {
            setBanner({ variant: "error", message: err instanceof Error ? err.message : "Ocurrió un error inesperado." });
        } finally {
            setBusy(false);
        }
    }

    async function handleBulkStatus(isActive: boolean) {
        await runBulk(
            () => bulkUpdateStatus([...selected], isActive),
            (count) => isActive ? `${count} usuarios activados.` : `${count} usuarios desactivados.`,
        );
    }

    async function handleBulkGrantRole() {
        if (!bulkRoleId) return;
        await runBulk(() => bulkGrantRole(bulkRoleId, [...selected]), (count) => `Rol asignado a ${count} usuarios.`);
    }

    async function handleBulkRevokeRole() {
        if (!bulkRoleId) return;
        await runBulk(() => bulkRevokeRole(bulkRoleId, [...selected]), (count) => `Rol revocado a ${count} usuarios.`);
    }

    async function handleConfirmedAction() {
        if (!confirmAction) return;
        setBusy(true);
        setBanner(null);
        try {
            if (confirmAction.kind === "delete-one") {
                await deleteUser(confirmAction.userId);
                setBanner({ variant: "success", message: `${confirmAction.userName} fue eliminado.` });
            } else {
                const result = await bulkDeleteUsers([...selected]);
                setBanner({ variant: "success", message: `${result.updated.length} usuarios eliminados.` });
            }
            setConfirmAction(null);
            reload();
        } catch (err) {
            setBanner({ variant: "error", message: err instanceof Error ? err.message : "Ocurrió un error inesperado." });
        } finally {
            setBusy(false);
        }
    }

    async function handleToggleStatus(targetUser: AdminUser) {
        setBusy(true);
        setBanner(null);
        try {
            await updateUserStatus(targetUser.id, !targetUser.is_active);
            reload();
        } catch (err) {
            setBanner({ variant: "error", message: err instanceof Error ? err.message : "No se pudo actualizar el usuario." });
        } finally {
            setBusy(false);
        }
    }

    const selectableCount = users.filter((u) => u.id !== currentUser?.id).length;
    const roleOptions = roles.map((role) => ({ value: role.id, label: role.name }));

    return (
        <section className={styles.page}>
            <header className={styles.hero}>
                <p className={styles.eyebrow}>Administración</p>
                <h1>Usuarios</h1>
                <p>Gestiona el acceso, estado y roles globales de los usuarios de Órbita.</p>
            </header>

            {banner && <Banner variant={banner.variant} message={banner.message} onDismiss={() => setBanner(null)} />}

            <div className={styles.toolbar}>
                <TextField
                    id="user-search"
                    label="Buscar"
                    placeholder="Nombre o correo…"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                />
            </div>

            {selected.size > 0 && (
                <div className={styles.bulkBar}>
                    <span>{selected.size} seleccionados</span>
                    <Button type="button" variant="ghost" disabled={busy} onClick={() => handleBulkStatus(true)}>Activar</Button>
                    <Button type="button" variant="ghost" disabled={busy} onClick={() => handleBulkStatus(false)}>Desactivar</Button>
                    <Select
                        id="bulk-role"
                        label=""
                        aria-label="Rol"
                        placeholder="Rol…"
                        options={roleOptions}
                        value={bulkRoleId}
                        onChange={(event) => setBulkRoleId(event.target.value)}
                    />
                    <Button type="button" variant="ghost" disabled={busy || !bulkRoleId} onClick={handleBulkGrantRole}>Asignar rol</Button>
                    <Button type="button" variant="ghost" disabled={busy || !bulkRoleId} onClick={handleBulkRevokeRole}>Quitar rol</Button>
                    <Button type="button" variant="ghost" disabled={busy} onClick={() => setConfirmAction({ kind: "delete-bulk" })}>Eliminar</Button>
                </div>
            )}

            <Table
                columns={[
                    {
                        key: "select",
                        header: selectableCount > 0 ? (
                            <Checkbox
                                checked={selected.size === selectableCount}
                                onChange={toggleSelectAll}
                                aria-label="Seleccionar todos"
                            />
                        ) : "",
                        render: (row: AdminUser) => row.id === currentUser?.id ? null : (
                            <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    checked={selected.has(row.id)}
                                    onChange={() => toggleSelected(row.id)}
                                    aria-label={`Seleccionar ${row.full_name}`}
                                />
                            </div>
                        ),
                    },
                    { key: "name", header: "Nombre", render: (row: AdminUser) => <strong>{row.full_name}</strong> },
                    { key: "email", header: "Correo", render: (row: AdminUser) => row.email },
                    {
                        key: "status",
                        header: "Estado",
                        render: (row: AdminUser) => (
                            <span className={row.is_active ? styles.statusActive : styles.statusInactive}>
                                {row.is_active ? "Activo" : "Inactivo"}
                            </span>
                        ),
                    },
                    {
                        key: "actions",
                        header: "Acciones",
                        render: (row: AdminUser) => row.id === currentUser?.id ? (
                            <span className={styles.selfNote}>Tu cuenta</span>
                        ) : (
                            <div className={styles.rowActions} onClick={(e) => e.stopPropagation()}>
                                <Button type="button" variant="ghost" disabled={busy} onClick={() => handleToggleStatus(row)}>
                                    {row.is_active ? "Desactivar" : "Activar"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    disabled={busy}
                                    onClick={() => setConfirmAction({ kind: "delete-one", userId: row.id, userName: row.full_name })}
                                >
                                    Eliminar
                                </Button>
                            </div>
                        ),
                    },
                ]}
                rows={users}
                getRowId={(row) => row.id}
                loading={loading}
                loadingMessage="Cargando usuarios…"
                error={error}
                emptyState={{ title: "No hay usuarios", description: "Ajusta la búsqueda o los filtros." }}
                onRowClick={setDetailUser}
            />

            <Pagination limit={LIMIT} offset={offset} itemCount={users.length} onPageChange={setOffset} />

            <UserDetailModal key={detailUser?.id ?? "none"} user={detailUser} roles={roles} onClose={() => setDetailUser(null)} />

            <Modal
                open={confirmAction !== null}
                onClose={() => setConfirmAction(null)}
                title="Confirmar eliminación"
            >
                <p>
                    {confirmAction?.kind === "delete-one"
                        ? `Esto eliminará a ${confirmAction.userName}. Esta acción no se puede deshacer desde aquí.`
                        : `Esto eliminará ${selected.size} usuarios seleccionados. Esta acción no se puede deshacer desde aquí.`}
                </p>
                <div className={styles.modalActions}>
                    <Button type="button" variant="ghost" onClick={() => setConfirmAction(null)}>Cancelar</Button>
                    <Button type="button" loading={busy} onClick={handleConfirmedAction}>Eliminar</Button>
                </div>
            </Modal>
        </section>
    );
}

export default UsersPage;
