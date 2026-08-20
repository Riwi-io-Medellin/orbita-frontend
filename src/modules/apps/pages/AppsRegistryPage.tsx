import { useEffect, useState } from "react";
import Banner from "../../../components/Banner";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import Pagination from "../../../components/Pagination";
import Table from "../../../components/Table";
import TextField from "../../../components/TextField";
import AppDetailPanel from "../components/AppDetailPanel";
import {
    createApp,
    listApps,
    updateAppStatus,
    type App,
    type AppCreated,
} from "../services/appRegistryService";
import styles from "./AppsRegistryPage.module.css";

const LIMIT = 20;
const EMPTY_FORM = { client_id: "", slug: "", name: "", description: "", url: "", icon: "" };

function AppsRegistryPage() {
    const [apps, setApps] = useState<App[]>([]);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [banner, setBanner] = useState<{ variant: "success" | "error"; message: string } | null>(null);
    const [busy, setBusy] = useState(false);

    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState<string | null>(null);
    const [createdSecret, setCreatedSecret] = useState<AppCreated | null>(null);

    useEffect(() => {
        listApps({ limit: LIMIT, offset })
            .then((result) => {
                setApps(result);
                setError(null);
            })
            .catch(() => setError("No se pudieron cargar las aplicaciones registradas."))
            .finally(() => setLoading(false));
    }, [offset]);

    function reload() {
        listApps({ limit: LIMIT, offset })
            .then(setApps)
            .catch(() => setError("No se pudieron cargar las aplicaciones registradas."))
            .finally(() => setLoading(false));
    }

    async function handleCreate() {
        setFormError(null);
        setBusy(true);
        try {
            const created = await createApp({
                client_id: form.client_id.trim(),
                slug: form.slug.trim(),
                name: form.name.trim(),
                description: form.description.trim(),
                url: form.url.trim(),
                icon: form.icon.trim() || null,
            });
            setCreateOpen(false);
            setForm(EMPTY_FORM);
            setCreatedSecret(created);
            reload();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "No se pudo registrar la aplicación.");
        } finally {
            setBusy(false);
        }
    }

    async function handleToggleStatus(app: App) {
        setBusy(true);
        setBanner(null);
        try {
            const updated = await updateAppStatus(app.client_id, !app.is_active);
            setApps((prev) => prev.map((item) => item.client_id === app.client_id ? updated : item));
        } catch (err) {
            setBanner({ variant: "error", message: err instanceof Error ? err.message : "No se pudo actualizar la aplicación." });
        } finally {
            setBusy(false);
        }
    }

    const selectedApp = apps.find((app) => app.client_id === selectedClientId) ?? null;

    return (
        <section className={styles.page}>
            <header className={styles.hero}>
                <p className={styles.eyebrow}>Administración</p>
                <h1>Aplicaciones SSO</h1>
                <p>Registra apps que usan el inicio de sesión centralizado de Órbita y gestiona sus roles y usuarios.</p>
            </header>

            {banner && <Banner variant={banner.variant} message={banner.message} onDismiss={() => setBanner(null)} />}

            <div className={styles.toolbar}>
                <Button type="button" onClick={() => setCreateOpen(true)}>Registrar aplicación</Button>
            </div>

            <Table
                columns={[
                    { key: "name", header: "Nombre", render: (row: App) => <strong>{row.name}</strong> },
                    { key: "client_id", header: "Client ID", render: (row: App) => row.client_id },
                    {
                        key: "status",
                        header: "Estado",
                        render: (row: App) => (
                            <span className={row.is_active ? styles.statusActive : styles.statusInactive}>
                                {row.is_active ? "Activa" : "Inactiva"}
                            </span>
                        ),
                    },
                    {
                        key: "actions",
                        header: "Acciones",
                        render: (row: App) => (
                            <div className={styles.rowActions}>
                                <Button type="button" variant="ghost" disabled={busy} onClick={() => handleToggleStatus(row)}>
                                    {row.is_active ? "Desactivar" : "Activar"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setSelectedClientId(selectedClientId === row.client_id ? null : row.client_id)}
                                >
                                    {selectedClientId === row.client_id ? "Ocultar" : "Gestionar"}
                                </Button>
                            </div>
                        ),
                    },
                ]}
                rows={apps}
                getRowId={(row) => row.id}
                loading={loading}
                loadingMessage="Cargando aplicaciones…"
                error={error}
                emptyState={{ title: "No hay aplicaciones registradas", description: "Registra la primera desde el botón de arriba." }}
            />

            <Pagination limit={LIMIT} offset={offset} itemCount={apps.length} onPageChange={setOffset} />

            {selectedApp && <AppDetailPanel app={selectedApp} />}

            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Registrar aplicación SSO">
                <form
                    className={styles.form}
                    onSubmit={(event) => {
                        event.preventDefault();
                        handleCreate();
                    }}
                >
                    {formError && <p className={styles.formError} role="alert">{formError}</p>}
                    <TextField id="reg-client-id" label="Client ID" required pattern="^[a-z0-9][a-z0-9._\-]*$" title="minúsculas, números, puntos, guiones" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} />
                    <TextField id="reg-slug" label="Slug" required pattern="^[a-z0-9][a-z0-9\-]*$" title="minúsculas, números, guiones" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                    <TextField id="reg-name" label="Nombre" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <TextField id="reg-description" label="Descripción" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    <TextField id="reg-url" label="URL" type="url" required value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
                    <TextField id="reg-icon" label="Icono (opcional)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
                    <div className={styles.modalActions}>
                        <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                        <Button type="submit" loading={busy}>Registrar</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                open={createdSecret !== null}
                onClose={() => setCreatedSecret(null)}
                title="Client secret"
            >
                <p className={styles.secretWarning}>
                    Copia el client secret de <strong>{createdSecret?.name}</strong> ahora — no se puede volver a mostrar.
                </p>
                <code className={styles.secretValue}>{createdSecret?.client_secret}</code>
                <div className={styles.modalActions}>
                    <Button type="button" onClick={() => setCreatedSecret(null)}>Ya lo copié, cerrar</Button>
                </div>
            </Modal>
        </section>
    );
}

export default AppsRegistryPage;
