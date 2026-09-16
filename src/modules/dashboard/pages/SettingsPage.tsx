import { Eye, EyeSlash, IdentificationCard, LockKey, User, UserCircle } from "@phosphor-icons/react";
import { useState } from "react";
import Button from "../../../components/Button";
import ErrorMessage from "../../../components/ErrorMessage";
import TextField from "../../../components/TextField";
import PageHeader from "../../../components/PageHeader";
import { useAuth } from "../../auth/hooks/useAuth";
import { changeMyPassword, updateMyProfile } from "../../auth/services/authService";
import styles from "./SettingsPage.module.css";

function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const [name, setName] = useState(user?.name ?? "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [activeSection, setActiveSection] = useState<"profile" | "security" | "access">(user?.must_change_password ? "security" : "profile");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    if (!user) return null;

    const loginMethod = user.auth_method === "moodle"
        ? "Moodle"
        : user.auth_method === "microsoft"
            ? "Microsoft"
            : user.is_local_account ? "Cuenta local de Órbita" : "Proveedor externo";

    async function saveName(event: React.FormEvent) {
        event.preventDefault(); setBusy(true); setError(null); setNotice(null);
        try { await updateMyProfile(name.trim()); await refreshUser(); setNotice("Tu nombre se actualizó."); }
        catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo actualizar tu nombre."); }
        finally { setBusy(false); }
    }

    async function savePassword(event: React.FormEvent) {
        event.preventDefault(); setBusy(true); setError(null); setNotice(null);
        if (newPassword !== confirmation) { setError("Las contraseñas nuevas no coinciden."); setBusy(false); return; }
        try { await changeMyPassword(currentPassword, newPassword); setCurrentPassword(""); setNewPassword(""); setConfirmation(""); await refreshUser(); setNotice("Tu contraseña se actualizó."); }
        catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo cambiar la contraseña."); }
        finally { setBusy(false); }
    }

    return (
        <section className={styles.page}>
            <PageHeader title={user.must_change_password ? "Crea tu contraseña" : "Tu cuenta"} description={user.must_change_password ? "Por seguridad, cambia la contraseña temporal antes de continuar." : "Administra tus datos de acceso a Órbita."} />
            {notice && <div className={styles.notice} role="status">{notice}</div>}
            {error && <ErrorMessage message={error} />}
            <article className={styles.account}>
                <div className={styles.identity}>
                    <span className={styles.avatar} aria-hidden="true"><User size={25} weight="bold" /></span>
                    <div>
                        <h2>{user.name}</h2>
                        <p>{user.email}</p>
                    </div>
                </div>
            </article>
            <div className={styles.settingsLayout}>
                <nav className={styles.sectionNav} aria-label="Secciones de configuración">
                    <p>CUENTA</p>
                    <button type="button" className={activeSection === "profile" ? styles.sectionActive : ""} onClick={() => setActiveSection("profile")}><UserCircle size={19} weight="bold" /><span>Perfil</span></button>
                    {user.is_local_account && <button type="button" className={activeSection === "security" ? styles.sectionActive : ""} onClick={() => setActiveSection("security")}><LockKey size={19} weight="bold" /><span>Seguridad</span></button>}
                    <button type="button" className={activeSection === "access" ? styles.sectionActive : ""} onClick={() => setActiveSection("access")}><IdentificationCard size={19} weight="bold" /><span>Acceso</span></button>
                </nav>
                <div className={styles.forms}>
                    {activeSection === "profile" ? user.is_local_account ? <form className={styles.card} onSubmit={saveName}>
                        <div><h2>Datos personales</h2><p>Actualiza el nombre que verán las aplicaciones.</p></div>
                        <TextField id="profile-name" label="Nombre" value={name} onChange={(event) => setName(event.target.value)} required />
                        <Button type="submit" loading={busy}>Guardar nombre</Button>
                    </form> : <section className={styles.card}>
                        <div><h2>Datos personales</h2><p>Tu nombre y correo se sincronizan desde {loginMethod}.</p></div>
                        <dl className={styles.accessDetails}>
                            <div><dt>Nombre</dt><dd>{user.name}</dd></div>
                            <div><dt>Correo</dt><dd>{user.email}</dd></div>
                        </dl>
                    </section> : activeSection === "security" ? <form className={styles.card} onSubmit={savePassword}>
                        <div><h2>{user.must_change_password ? "Cambia tu contraseña temporal" : "Cambiar contraseña"}</h2><p>Usa al menos 8 caracteres y no reutilices una anterior.</p></div>
                        <TextField id="current-password" label="Contraseña actual" type={showCurrent ? "text" : "password"} autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required rightSlot={<button type="button" className={styles.passwordToggle} onClick={() => setShowCurrent((value) => !value)} aria-label={showCurrent ? "Ocultar contraseña actual" : "Mostrar contraseña actual"}>{showCurrent ? <EyeSlash size={19} /> : <Eye size={19} />}</button>} />
                        <TextField id="new-password" label="Nueva contraseña" type={showNew ? "text" : "password"} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} required rightSlot={<button type="button" className={styles.passwordToggle} onClick={() => setShowNew((value) => !value)} aria-label={showNew ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}>{showNew ? <EyeSlash size={19} /> : <Eye size={19} />}</button>} />
                        <TextField id="confirm-password" label="Repite la nueva contraseña" type={showConfirmation ? "text" : "password"} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} required rightSlot={<button type="button" className={styles.passwordToggle} onClick={() => setShowConfirmation((value) => !value)} aria-label={showConfirmation ? "Ocultar confirmación" : "Mostrar confirmación"}>{showConfirmation ? <EyeSlash size={19} /> : <Eye size={19} />}</button>} />
                        <Button type="submit" loading={busy}>{user.must_change_password ? "Continuar" : "Actualizar contraseña"}</Button>
                    </form> : <section className={styles.card} aria-labelledby="access-title">
                        <div><h2 id="access-title">Tu acceso en Órbita</h2><p>Información de los permisos y el estado actual de tu cuenta.</p></div>
                        <dl className={styles.accessDetails}>
                            <div><dt>Rol en Órbita</dt><dd>{user.roles.join(", ") || "Sin rol asignado"}</dd></div>
                            <div><dt>Estado de la cuenta</dt><dd><span className={styles.active}>Activa</span></dd></div>
                            <div><dt>Inicio de sesión</dt><dd>{loginMethod}</dd></div>
                        </dl>
                    </section>}
                </div>
            </div>
        </section>
    );
}

export default SettingsPage;
