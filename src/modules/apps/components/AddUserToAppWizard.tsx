import { useState } from "react";
import Banner from "../../../components/Banner";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import Select from "../../../components/Select";
import type { AdminUser } from "../../users/services/userService";
import { bulkAssignAppRole, bulkGrantVisibility, type App, type AppRole } from "../services/appRegistryService";
import UserMultiPicker from "./UserMultiPicker";
import styles from "./AddUserToAppWizard.module.css";

interface AddUserToAppWizardProps {
    app: App;
    roles: AppRole[];
    open: boolean;
    onClose: () => void;
    onDone: () => void;
}

function AddUserToAppWizard({ app, roles, open, onClose, onDone }: AddUserToAppWizardProps) {
    const [picked, setPicked] = useState<AdminUser[]>([]);
    const [roleId, setRoleId] = useState("");
    const [busy, setBusy] = useState(false);
    const [banner, setBanner] = useState<{ variant: "success" | "error"; message: string } | null>(null);

    function reset() {
        setPicked([]);
        setRoleId("");
        setBanner(null);
    }

    function handleClose() {
        reset();
        onClose();
    }

    function handleFinish() {
        reset();
        onClose();
        onDone();
    }

    async function handleGrantVisibility() {
        if (!app.application_id || picked.length === 0) return;
        setBusy(true);
        setBanner(null);
        try {
            await bulkGrantVisibility(app.application_id, picked.map((u) => u.id));
            setBanner({ variant: "success", message: "Visibilidad otorgada." });
        } catch (err) {
            setBanner({ variant: "error", message: err instanceof Error ? err.message : "No se pudo otorgar visibilidad." });
        } finally {
            setBusy(false);
        }
    }

    async function handleAssignRole() {
        if (!roleId || picked.length === 0) return;
        setBusy(true);
        setBanner(null);
        try {
            await bulkAssignAppRole(app.client_id, roleId, picked.map((u) => u.id));
            setBanner({ variant: "success", message: "Rol asignado." });
        } catch (err) {
            setBanner({ variant: "error", message: err instanceof Error ? err.message : "No se pudo asignar el rol." });
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal open={open} onClose={handleClose} title="Agregar usuario a la aplicación">
            <div className={styles.wizard}>
                {banner && <Banner variant={banner.variant} message={banner.message} onDismiss={() => setBanner(null)} />}

                <section className={styles.step}>
                    <h4 className={styles.stepTitle}>1. Otorgar visibilidad</h4>
                    {!app.application_id ? (
                        <p className={styles.hint}>
                            Esta aplicación no tiene un id de catálogo — no se puede gestionar visibilidad todavía.
                        </p>
                    ) : (
                        <>
                            <UserMultiPicker id="wizard-user-picker" label="Usuario (nombre o correo)" selected={picked} onChange={setPicked} disabled={busy} />
                            <Button type="button" disabled={busy || picked.length === 0} onClick={handleGrantVisibility}>
                                Otorgar visibilidad
                            </Button>
                        </>
                    )}
                </section>

                <section className={styles.step}>
                    <h4 className={styles.stepTitle}>2. Asignar rol (opcional)</h4>
                    <div className={styles.roleRow}>
                        <Select
                            id="wizard-role"
                            label="Rol"
                            placeholder="Rol…"
                            options={roles.map((role) => ({ value: role.id, label: role.name }))}
                            value={roleId}
                            disabled={busy || picked.length === 0}
                            onChange={(event) => setRoleId(event.target.value)}
                        />
                        <Button type="button" disabled={busy || !roleId || picked.length === 0} onClick={handleAssignRole}>
                            Asignar rol
                        </Button>
                    </div>
                </section>

                <div className={styles.actions}>
                    <Button type="button" variant="ghost" onClick={handleClose}>Cancelar</Button>
                    <Button type="button" onClick={handleFinish}>Finalizar</Button>
                </div>
            </div>
        </Modal>
    );
}

export default AddUserToAppWizard;
