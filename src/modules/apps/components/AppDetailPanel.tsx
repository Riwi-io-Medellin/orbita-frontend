import { useEffect, useState } from "react";
import Banner from "../../../components/Banner";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import TextField from "../../../components/TextField";
import {
    addRedirectUri,
    createAppRole,
    deleteAppRole,
    listAppRoles,
    type App,
    type AppRole,
} from "../services/appRegistryService";
import AppMembersSection from "./AppMembersSection";
import styles from "./AppDetailPanel.module.css";

interface AppDetailPanelProps {
    app: App;
}

function isValidRedirectUri(value: string): boolean {
    try {
        const url = new URL(value);
        return (url.protocol === "http:" || url.protocol === "https:") && !url.hash;
    } catch {
        return false;
    }
}

function AppDetailPanel({ app }: AppDetailPanelProps) {
    const [roles, setRoles] = useState<AppRole[]>([]);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [rolesError, setRolesError] = useState<string | null>(null);

    const [banner, setBanner] = useState<{ variant: "success" | "error"; message: string } | null>(null);
    const [busy, setBusy] = useState(false);

    const [redirectUriInput, setRedirectUriInput] = useState("");
    const [newRoleName, setNewRoleName] = useState("");

    function reloadRoles() {
        setRolesLoading(true);
        listAppRoles(app.client_id)
            .then(setRoles)
            .catch(() => setRolesError("No se pudieron cargar los roles."))
            .finally(() => setRolesLoading(false));
    }

    useEffect(() => {
        listAppRoles(app.client_id)
            .then((result) => {
                setRoles(result);
                setRolesError(null);
            })
            .catch(() => setRolesError("No se pudieron cargar los roles."))
            .finally(() => setRolesLoading(false));
    }, [app.client_id]);

    async function handleAddRedirectUri() {
        if (!isValidRedirectUri(redirectUriInput)) {
            setBanner({ variant: "error", message: "El redirect URI debe ser una URL HTTP(S) absoluta sin fragmento (#)." });
            return;
        }
        setBusy(true);
        setBanner(null);
        try {
            await addRedirectUri(app.client_id, redirectUriInput);
            setBanner({ variant: "success", message: "Redirect URI registrado." });
            setRedirectUriInput("");
        } catch (err) {
            setBanner({ variant: "error", message: err instanceof Error ? err.message : "No se pudo registrar el redirect URI." });
        } finally {
            setBusy(false);
        }
    }

    async function handleCreateRole() {
        if (!newRoleName.trim()) return;
        setBusy(true);
        setBanner(null);
        try {
            await createAppRole(app.client_id, newRoleName.trim());
            setNewRoleName("");
            reloadRoles();
        } catch (err) {
            setBanner({ variant: "error", message: err instanceof Error ? err.message : "No se pudo crear el rol." });
        } finally {
            setBusy(false);
        }
    }

    async function handleDeleteRole(role: AppRole) {
        setBusy(true);
        setBanner(null);
        try {
            await deleteAppRole(app.client_id, role.id);
            reloadRoles();
        } catch (err) {
            setBanner({ variant: "error", message: err instanceof Error ? err.message : "No se pudo eliminar el rol." });
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className={styles.panel}>
            {banner && <Banner variant={banner.variant} message={banner.message} onDismiss={() => setBanner(null)} />}

            <section className={styles.section}>
                <h3>Redirect URIs</h3>
                <p className={styles.hint}>
                    Solo se pueden registrar — la API no permite listar ni eliminar los ya guardados.
                </p>
                <div className={styles.inlineForm}>
                    <TextField
                        id="redirect-uri"
                        label="Nuevo redirect URI"
                        placeholder="https://miapp.riwi.io/auth/callback"
                        value={redirectUriInput}
                        onChange={(e) => setRedirectUriInput(e.target.value)}
                    />
                    <Button type="button" disabled={busy || !redirectUriInput} onClick={handleAddRedirectUri}>Agregar</Button>
                </div>
            </section>

            <section className={styles.section}>
                <h3>Roles de la aplicación</h3>
                <div className={styles.inlineForm}>
                    <TextField
                        id="new-role-name"
                        label="Nuevo rol"
                        placeholder="staff"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                    />
                    <Button type="button" disabled={busy || !newRoleName.trim()} onClick={handleCreateRole}>Crear rol</Button>
                </div>

                <Table
                    columns={[
                        { key: "name", header: "Nombre", render: (row: AppRole) => row.name },
                        {
                            key: "actions",
                            header: "",
                            render: (row: AppRole) => (
                                <Button type="button" variant="ghost" disabled={busy} onClick={() => handleDeleteRole(row)}>
                                    Eliminar
                                </Button>
                            ),
                        },
                    ]}
                    rows={roles}
                    getRowId={(row) => row.id}
                    loading={rolesLoading}
                    loadingMessage="Cargando roles…"
                    error={rolesError}
                    emptyState={{ title: "Sin roles", description: "Crea el primer rol para esta aplicación." }}
                />
            </section>

            <AppMembersSection app={app} roles={roles} />
        </div>
    );
}

export default AppDetailPanel;
