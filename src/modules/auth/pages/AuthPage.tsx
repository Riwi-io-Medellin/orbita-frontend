import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Button from "../../../components/Button";
import ErrorMessage from "../../../components/ErrorMessage";
import TextField from "../../../components/TextField";
import { login, passwordLogin } from "../services/authService";
import { useAuth } from "../hooks/useAuth";
import { env } from "../../../config/env";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import styles from "./AuthPage.module.css";

function AuthPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { refreshUser } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function continueAfterLogin() {
        const continueUrl = searchParams.get("continue");
        if (!continueUrl) {
            navigate("/apps", { replace: true });
            return;
        }

        try {
            const target = new URL(continueUrl);
            const api = new URL(env.apiUrl);
            if (target.origin === api.origin && target.pathname === "/api/sso/authorize") {
                window.location.assign(target.toString());
                return;
            }
        } catch {
            // Invalid continuation URLs return to the normal catalog.
        }
        navigate("/apps", { replace: true });
    }

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        setError(null); setLoading(true);
        try { await passwordLogin(email, password); await refreshUser(); continueAfterLogin(); }
        catch { setError("Correo o contraseña inválidos."); }
        finally { setLoading(false); }
    }

    return (
        <>
            <div className={styles.header}>
                <h1 className={styles.title}>Bienvenido de vuelta</h1>
            </div>
            <form className={styles.form} onSubmit={submit}>
                <TextField id="email" label="Email" type="email" placeholder="ejemplo@orbita.co" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                <TextField id="password" label="Contraseña" type={showPassword ? "text" : "password"} placeholder="••••••••••••" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required rightSlot={<button className={styles.passwordToggle} type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? <EyeSlash size={20} weight="bold" /> : <Eye size={20} weight="bold" />}</button>} />
                {error && <ErrorMessage message={error} />}
                <div className={styles.recovery}><span>¿Olvidaste tu contraseña?</span><span>Contacta a un administrador para restablecerla.</span></div>
                <Button type="submit" fullWidth loading={loading}>Iniciar sesión</Button>
            </form>
            <div className={styles.divider}><span>O continúa con</span></div>
            <Button type="button" fullWidth variant="ghost" className={styles.microsoftButton} onClick={() => login(searchParams.get("continue"))}>
                <span className={styles.microsoftLogo} aria-hidden="true"><i /><i /><i /><i /></span>
                Continuar con Microsoft
            </Button>
        </>
    );
}

export default AuthPage;
