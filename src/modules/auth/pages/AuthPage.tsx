import Button from "../../../components/Button";
import { login } from "../services/authService";
import styles from "./AuthPage.module.css";

function AuthPage() {
    return (
        <>
            <div className={styles.header}>
                <h1 className={styles.title}>Iniciar sesión</h1>
                <p className={styles.subtitle}>Accede a tu espacio de Órbita</p>
            </div>

            <Button type="button" fullWidth onClick={login}>
                Continuar con Microsoft
            </Button>
        </>
    );
}

export default AuthPage;
