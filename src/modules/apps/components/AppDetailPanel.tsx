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
    rotateAppSecret,
    type App,
    type AppRole,
} from "../services/appRegistryService";
import AppMembersSection from "./AppMembersSection";
import styles from "./AppDetailPanel.module.css";

interface AppDetailPanelProps {
    app: App;
    className?: string;
}

function isValidRedirectUri(value: string): boolean {
    try {
        const url = new URL(value);
        return (url.protocol === "http:" || url.protocol === "https:") && !url.hash;
    } catch {
        return false;
    }
}

function AppDetailPanel({ app, className }: AppDetailPanelProps) {
    const [activeSection, setActiveSection] = useState<"people" | "roles" | "settings">("people");
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
    const [rotatedSecret, setRotatedSecret] = useState<{ value: string; expiresAt: string } | null>(null);

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

    async function handleRotateSecret() {
        if (!window.confirm("Esto invalida el secreto actual en 15 minutos. Confirma que puedes actualizar la configuración de la aplicación ahora.")) return;
        setBusy(true);
        setBanner(null);
        try {
            const rotated = await rotateAppSecret(app.client_id);
            setRotatedSecret({ value: rotated.client_secret, expiresAt: rotated.previous_secret_expires_at });
            setBanner({ variant: "success", message: "Secreto rotado. Guárdalo ahora: no se volverá a mostrar." });
        } catch (err) {
            setBanner({ variant: "error", message: err instanceof Error ? err.message : "No se pudo rotar el secreto." });
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className={[styles.panel, className].filter(Boolean).join(" ")}>
            {banner && <Banner variant={banner.variant} message={banner.message} onDismiss={() => setBanner(null)} />}

            <header className={styles.summary}>
                <h2>{app.name}</h2>
                <p>Gestiona el acceso a esta aplicación.</p>
            </header>

            <div className={styles.sectionTabs} role="tablist" aria-label={`Gestión de ${app.name}`}>
                <button type="button" role="tab" aria-selected={activeSection === "people"} className={activeSection === "people" ? styles.activeTab : ""} onClick={() => setActiveSection("people")}>Personas</button>
                <button type="button" role="tab" aria-selected={activeSection === "roles"} className={activeSection === "roles" ? styles.activeTab : ""} onClick={() => setActiveSection("roles")}>Roles</button>
                <button type="button" role="tab" aria-selected={activeSection === "settings"} className={activeSection === "settings" ? styles.activeTab : ""} onClick={() => setActiveSection("settings")}>Configuración</button>
            </div>

            {activeSection === "roles" && <section className={styles.section}>
                <h3>Roles de la aplicación</h3>
                <p className={styles.hint}>Define los roles que esta aplicación puede entregar.</p>
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
                    className={styles.flatTable}
                />
            </section>}

            {activeSection === "people" && <AppMembersSection app={app} roles={roles} />}

            {activeSection === "settings" && <section className={styles.settings}>
                <p className={styles.hint}>Estas opciones conectan Órbita con la aplicación. Úsalas solo si administras su integración.</p>
                <details className={styles.settingsGroup}>
                    <summary>Secreto de cliente</summary>
                    <section className={styles.section}>
                        <p className={styles.hint}>Rótalo solo cuando puedas actualizar la aplicación. El secreto anterior expira en 15 minutos.</p>
                        <div><Button type="button" variant="ghost" disabled={busy} onClick={handleRotateSecret}>Rotar secreto</Button></div>
                        {rotatedSecret && <div className={styles.secretBox}>
                            <code>{rotatedSecret.value}</code>
                            <small>El secreto anterior vence: {new Date(rotatedSecret.expiresAt).toLocaleString()}.</small>
                        </div>}
                    </section>
                </details>

                <details className={styles.settingsGroup}>
                    <summary>Conexiones</summary>
                    <section className={styles.section}>
                        <h3>URI posterior al logout</h3>
                        <div className={styles.inlineForm}>
                            <TextField id="post-logout-uri" label="URL" placeholder="http://localhost:5174/login" value={postLogoutUriInput} onChange={(e) => setPostLogoutUriInput(e.target.value)} />
                            <Button type="button" disabled={busy || !postLogoutUriInput} onClick={async () => { try { await addPostLogoutUri(app.client_id, postLogoutUriInput); setPostLogoutUriInput(""); setBanner({ variant: "success", message: "URI de logout registrada." }); } catch (err) { setBanner({ variant: "error", message: err instanceof Error ? err.message : "No se pudo registrar." }); } }}>Agregar</Button>
                        </div>
                        <h3>Redirect URI</h3>
                        <p className={styles.hint}>Solo puedes agregar una nueva dirección; las ya registradas no se pueden consultar desde aquí.</p>
                        <div className={styles.inlineForm}>
                            <TextField id="redirect-uri" label="URL" placeholder="https://miapp.riwi.io/auth/callback" value={redirectUriInput} onChange={(e) => setRedirectUriInput(e.target.value)} />
                            <Button type="button" disabled={busy || !redirectUriInput} onClick={handleAddRedirectUri}>Agregar</Button>
                        </div>
                    </section>
                </details>

                <details className={styles.settingsGroup}>
                    <summary>Opciones avanzadas</summary>
                    <section className={styles.section}>
                        <p className={styles.hint}>Úsalas únicamente durante una migración o cuando la integración lo requiera.</p>
                        <label><input type="checkbox" checked={policy.role_cardinality === "single"} onChange={(e) => setPolicy({ ...policy, role_cardinality: e.target.checked ? "single" : "multiple" })} /> Un solo rol por usuario</label><br />
                        <label><input type="checkbox" checked={policy.migration_access_enabled} onChange={(e) => setPolicy({ ...policy, migration_access_enabled: e.target.checked })} /> Acceso temporal para usuarios no guest</label><br />
                        <label><input type="checkbox" checked={policy.jit_role_adoption_enabled} onChange={(e) => setPolicy({ ...policy, jit_role_adoption_enabled: e.target.checked })} /> Permitir adopción JIT de roles locales</label><br />
                        <label><input type="checkbox" checked={policy.released_claims.includes("clan")} onChange={(e) => setPolicy({ ...policy, released_claims: e.target.checked ? ["clan"] : [] })} /> Entregar clan autorizado</label>
                        <div className={styles.inlineForm}><Button type="button" disabled={busy} onClick={handleSavePolicy}>Guardar política</Button></div>
                        <div className={styles.inlineForm}>
                            <Button type="button" disabled={busy} onClick={async () => { try { await upsertGlobalRoleMapping(app.client_id, "coder", "coder"); setBanner({ variant: "success", message: "Mapeo coder → coder guardado." }); } catch (err) { setBanner({ variant: "error", message: err instanceof Error ? err.message : "No se pudo guardar el mapeo." }); } }}>Configurar coder → coder</Button>
                        </div>
                    </section>
                </details>
            </section>}
        </div>
    );
}

export default AppDetailPanel;
