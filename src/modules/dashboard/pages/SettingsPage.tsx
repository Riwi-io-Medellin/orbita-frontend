import { useAuth } from "../../auth/hooks/useAuth";
import styles from "./SettingsPage.module.css";

function SettingsPage() {
    const { user } = useAuth();

    return (
        <section className={styles.page}>
            <header className={styles.hero}>
                <p className={styles.eyebrow}>Tu cuenta</p>
                <h1>Configuración</h1>
                <p>Consulta la información de tu perfil dentro de Órbita.</p>
            </header>
            <article className={styles.card}>
                <div className={styles.avatar}>{user?.name.slice(0, 1).toUpperCase()}</div>
                <div><p className={styles.label}>Nombre</p><strong>{user?.name}</strong></div>
                <div><p className={styles.label}>Correo</p><strong>{user?.email}</strong></div>
                <div><p className={styles.label}>Rol</p><strong>{user?.roles.join(", ") || "Sin rol"}</strong></div>
            </article>
        </section>
    );
}

export default SettingsPage;
