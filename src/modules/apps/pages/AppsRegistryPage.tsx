import { useEffect, useState } from "react";
import { Key, RocketLaunch } from "@phosphor-icons/react";
import Banner from "../../../components/Banner";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import PageHeader from "../../../components/PageHeader";
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

    function openCreateForm() {
        setFormError(null);
        setCreateOpen(true);
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
            <PageHeader
                title="Apps"
                description="Gestiona las aplicaciones conectadas a Órbita y quién puede usarlas."
                actions={<Button type="button" onClick={openCreateForm}>Registrar aplicación</Button>}
            />

            {banner && <Banner variant={banner.variant} message={banner.message} onDismiss={() => setBanner(null)} />}

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
                className={styles.flatTable}
            />

            <Pagination limit={LIMIT} offset={offset} itemCount={apps.length} onPageChange={setOffset} />

            <Modal
                open={selectedApp !== null}
                onClose={() => setSelectedClientId(null)}
                title={selectedApp ? `Gestionar ${selectedApp.name}` : "Gestionar aplicación"}
                dialogClassName={styles.manageDialog}
            >
                {selectedApp && <AppDetailPanel key={selectedApp.client_id} app={selectedApp} className={styles.modalDetail} />}
            </Modal>

            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Conectar una aplicación" dialogClassName={styles.createDialog}>
                <form
                    className={styles.form}
                    onSubmit={(event) => {
                        event.preventDefault();
                        handleCreate();
                    }}
                >
                    <div className={styles.formIntro}>
                        <span className={styles.introIcon} aria-hidden="true"><RocketLaunch size={22} weight="bold" /></span>
                        <div>
                            <p>Conecta una aplicación al inicio de sesión de Órbita.</p>
                        </div>
                    </div>
                    {formError && <p className={styles.formError} role="alert">{formError}</p>}
                    <fieldset className={styles.formSection}>
                        <legend>Identidad de la aplicación</legend>
                        <div className={styles.formGrid}>
                            <TextField id="reg-client-id" label="Client ID" placeholder="teamlead" required minLength={2} maxLength={255} pattern="^[a-z0-9][a-z0-9._\-]*$" title="Usa minúsculas, números, puntos, guiones y guiones bajos." autoCapitalize="none" autoComplete="off" spellCheck={false} value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} />
                            <TextField id="reg-slug" label="Slug" placeholder="teamlead" required minLength={2} maxLength={80} pattern="^[a-z0-9][a-z0-9\-]*$" title="Usa minúsculas, números y guiones." autoCapitalize="none" autoComplete="off" spellCheck={false} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                            <TextField id="reg-name" fieldClassName={styles.fullField} label="Nombre de la aplicación" placeholder="TeamLead" required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            <label className={[styles.textareaField, styles.fullField].join(" ")} htmlFor="reg-description">
                                <span>Descripción</span>
                                <textarea id="reg-description" placeholder="Clases, líderes y horarios." required maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                            </label>
                        </div>
                    </fieldset>
                    <fieldset className={styles.formSection}>
                        <legend>Dirección de acceso</legend>
                        <div className={styles.formGrid}>
                            <TextField id="reg-url" fieldClassName={styles.fullField} label="URL de la aplicación" type="url" placeholder="https://teamlead.riwi.io" required maxLength={2048} autoCapitalize="none" autoComplete="url" spellCheck={false} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
                        </div>
                    </fieldset>
                    <div className={styles.secretNotice}>
                        <Key size={18} weight="bold" aria-hidden="true" />
                        <p>El secreto se muestra una sola vez. Guárdalo en la configuración segura de la aplicación.</p>
                    </div>
                    <div className={styles.modalActions}>
                        <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                        <Button type="submit" loading={busy}>Crear aplicación</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                open={createdSecret !== null}
                onClose={() => setCreatedSecret(null)}
                title="Guarda el secreto de cliente"
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
