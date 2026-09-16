import { useState } from "react";
import Banner from "../../../components/Banner";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import RoleDropdown from "../../../components/RoleDropdown";
import type { AdminUser } from "../../users/services/userService";
import { bulkAssignAppRole, type App, type AppRole } from "../services/appRegistryService";
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

    async function handleAssignRole() {
        if (!roleId || picked.length === 0) return;
        setBusy(true);
        setBanner(null);
        try {
            await bulkAssignAppRole(app.client_id, roleId, picked.map((u) => u.id));
            setBanner({ variant: "success", message: `Acceso otorgado a ${picked.length} ${picked.length === 1 ? "persona" : "personas"}.` });
            onDone();
        } catch (err) {
            setBanner({ variant: "error", message: err instanceof Error ? err.message : "No se pudo asignar el rol." });
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal open={open} onClose={handleClose} title="Asignar acceso">
            <div className={styles.wizard}>
                {banner && <Banner variant={banner.variant} message={banner.message} onDismiss={() => setBanner(null)} />}

                <section className={styles.step}>
                    <p className={styles.hint}>Elige personas y un rol. Al confirmar, se asignará a todas las seleccionadas.</p>
                    <UserMultiPicker id="wizard-user-picker" label="Usuario (nombre o correo)" selected={picked} onChange={setPicked} disabled={busy} />
                    <div className={styles.roleRow}>
                        <div className={styles.roleField}>
                            <span>Rol</span>
                            <RoleDropdown
                            ariaLabel="Rol"
                            placeholder="Rol…"
                            options={roles.map((role) => ({ value: role.id, label: `${role.display_name} (${role.name})` }))}
                            value={roleId}
                            disabled={busy || picked.length === 0}
                            onChange={setRoleId}
                            />
                        </div>
                        <Button type="button" disabled={busy || !roleId || picked.length === 0} onClick={handleAssignRole}>
                            {picked.length > 0 ? `Asignar a ${picked.length} ${picked.length === 1 ? "persona" : "personas"}` : "Asignar acceso"}
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
