import { useEffect, useState } from "react";
import Banner from "../../../components/Banner";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import TextField from "../../../components/TextField";
import {
    addRedirectUri,
    addPostLogoutUri,
    createAppRole,
    deleteAppRole,
    listAppRoles,
    updateAppPolicy,
    upsertGlobalRoleMapping,
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
    const [postLogoutUriInput, setPostLogoutUriInput] = useState("");
    const [policy, setPolicy] = useState({
        role_cardinality: app.role_cardinality,
        migration_access_enabled: app.migration_access_enabled,
        jit_role_adoption_enabled: app.jit_role_adoption_enabled,
        released_claims: app.released_claims,
    });
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

    async function handleSavePolicy() {
        setBusy(true);
        setBanner(null);
        try {
            const updated = await updateAppPolicy(app.client_id, policy);
            setPolicy({
                role_cardinality: updated.role_cardinality,
                migration_access_enabled: updated.migration_access_enabled,
                jit_role_adoption_enabled: updated.jit_role_adoption_enabled,
                released_claims: updated.released_claims,
            });
            setBanner({ variant: "success", message: "Política SSO actualizada." });
        } catch (err) {
            setBanner({ variant: "error", message: err instanceof Error ? err.message : "No se pudo actualizar la política." });
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
                <h3>Política de acceso y migración</h3>
                <p className={styles.hint}>El canal JIT puede permanecer activo durante toda la migración y apagarse aquí sin redesplegar.</p>
                <label><input type="checkbox" checked={policy.role_cardinality === "single"} onChange={(e) => setPolicy({ ...policy, role_cardinality: e.target.checked ? "single" : "multiple" })} /> Un solo rol por usuario</label><br />
                <label><input type="checkbox" checked={policy.migration_access_enabled} onChange={(e) => setPolicy({ ...policy, migration_access_enabled: e.target.checked })} /> Acceso temporal para usuarios no guest</label><br />
                <label><input type="checkbox" checked={policy.jit_role_adoption_enabled} onChange={(e) => setPolicy({ ...policy, jit_role_adoption_enabled: e.target.checked })} /> Permitir adopción JIT de roles locales</label><br />
                <label><input type="checkbox" checked={policy.released_claims.includes("clan")} onChange={(e) => setPolicy({ ...policy, released_claims: e.target.checked ? ["clan"] : [] })} /> Entregar clan autorizado</label>
                <div className={styles.inlineForm}><Button type="button" disabled={busy} onClick={handleSavePolicy}>Guardar política</Button></div>
                <div className={styles.inlineForm}>
                    <TextField id="post-logout-uri" label="URI posterior al logout" placeholder="http://localhost:5174/login" value={postLogoutUriInput} onChange={(e) => setPostLogoutUriInput(e.target.value)} />
                    <Button type="button" disabled={busy || !postLogoutUriInput} onClick={async () => { try { await addPostLogoutUri(app.client_id, postLogoutUriInput); setPostLogoutUriInput(""); setBanner({ variant: "success", message: "URI de logout registrada." }); } catch (err) { setBanner({ variant: "error", message: err instanceof Error ? err.message : "No se pudo registrar." }); } }}>Agregar</Button>
                </div>
                <div className={styles.inlineForm}>
                    <Button type="button" disabled={busy} onClick={async () => { try { await upsertGlobalRoleMapping(app.client_id, "coder", "coder"); setBanner({ variant: "success", message: "Mapeo coder → coder guardado." }); } catch (err) { setBanner({ variant: "error", message: err instanceof Error ? err.message : "No se pudo guardar el mapeo." }); } }}>Configurar coder → coder</Button>
                </div>
            </section>

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
                <p className={styles.hint}>
                    Sincroniza el catálogo desde el backend de la aplicación. La clave técnica se envía en el JWT y el
                    nombre visible solo se usa para administración.
                </p>
                <div className={styles.inlineForm}>
                    <TextField
                        id="new-role-name"
                        label="Rol manual legado"
                        placeholder="staff"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                    />
                    <Button type="button" disabled={busy || !newRoleName.trim()} onClick={handleCreateRole}>Crear rol manual</Button>
                </div>

                <Table
                    columns={[
                        {
                            key: "name",
                            header: "Rol",
                            render: (row: AppRole) => <><strong>{row.display_name}</strong><br /><small>{row.name}</small></>,
                        },
                        {
                            key: "source",
                            header: "Origen",
                            render: (row: AppRole) => row.managed_by_app ? "Sincronizado" : "Manual legado",
                        },
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
                    emptyState={{ title: "Sin roles", description: "Sincroniza el catálogo desde el backend de esta aplicación." }}
                />
            </section>

            <AppMembersSection app={app} roles={roles} />
        </div>
    );
}

export default AppDetailPanel;
