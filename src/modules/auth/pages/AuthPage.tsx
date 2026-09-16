import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Button from "../../../components/Button";
import ErrorMessage from "../../../components/ErrorMessage";
import Spinner from "../../../components/Spinner";
import TextField from "../../../components/TextField";
import { getAuthenticationProviders, login, passwordLogin, type AuthenticationProviders } from "../services/authService";
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
    const [providers, setProviders] = useState<AuthenticationProviders | null>(null);
    const [providersLoading, setProvidersLoading] = useState(true);
    const [providersError, setProvidersError] = useState<string | null>(null);
    const initialError = searchParams.get("error");
    const [error, setError] = useState<string | null>(
        initialError === "sso_access_denied"
            ? "Tu cuenta no tiene acceso a esta aplicación."
            : initialError === "sso_session_missing"
              ? "La solicitud de acceso expiró. Intenta abrir la aplicación nuevamente."
              : null,
    );

    function reloadProviders() {
        setProvidersLoading(true);
        setProvidersError(null);
        getAuthenticationProviders()
            .then(setProviders)
            .catch(() => setProvidersError("No pudimos conectar con Órbita para consultar los métodos de inicio de sesión."))
            .finally(() => setProvidersLoading(false));
    }

    useEffect(() => {
        let active = true;
        getAuthenticationProviders()
            .then((available) => { if (active) setProviders(available); })
            .catch(() => { if (active) setProvidersError("No pudimos conectar con Órbita para consultar los métodos de inicio de sesión."); })
            .finally(() => { if (active) setProvidersLoading(false); });
        return () => { active = false; };
    }, []);

    function continueAfterLogin() {
        const continueUrl = searchParams.get("continue");
        if (continueUrl !== "sso") {
            navigate("/apps", { replace: true });
            return;
        }
        window.location.assign(`${env.apiUrl}/auth/resume`);
    }

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        setError(null); setLoading(true);
        try { await passwordLogin(email, password); await refreshUser(); continueAfterLogin(); }
        catch { setError("Correo o contraseña inválidos."); }
        finally { setLoading(false); }
    }

    function openMoodleLogin() {
        const continueUrl = searchParams.get("continue");
        const query = continueUrl ? `?continue=${encodeURIComponent(continueUrl)}` : "";
        navigate(`/auth/moodle${query}`);
    }

    return (
        <>
            <div className={styles.header}>
                <h1 className={styles.title}>Bienvenido de vuelta</h1>
            </div>
            {error && <ErrorMessage message={error} />}
            {providersLoading ? <div className={styles.providerState} role="status">
                <Spinner size="sm" />
                <span>Comprobando métodos de inicio de sesión…</span>
            </div> : providersError ? <div className={styles.providerState}>
                <ErrorMessage message={providersError} />
                <Button type="button" variant="ghost" onClick={reloadProviders}>Reintentar</Button>
            </div> : <>
            {providers?.local && <form className={styles.form} onSubmit={submit}>
                <TextField id="email" label="Correo" type="email" placeholder="ejemplo@orbita.co" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                <TextField id="password" label="Contraseña" type={showPassword ? "text" : "password"} placeholder="••••••••••••" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required rightSlot={<button className={styles.passwordToggle} type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? <EyeSlash size={20} weight="bold" /> : <Eye size={20} weight="bold" />}</button>} />
                <p className={styles.recovery}>¿Olvidaste tu contraseña? Contacta a soporte.</p>
                <Button type="submit" fullWidth loading={loading}>Iniciar sesión</Button>
            </form>}
            {providers && !providers.local && !providers.microsoft && !providers.moodle && <ErrorMessage message="No hay métodos de inicio de sesión disponibles temporalmente." />}
            {providers && (providers.local && (providers.microsoft || providers.moodle)) && <div className={styles.divider}><span>O continúa con</span></div>}
            {providers?.microsoft && <Button type="button" fullWidth variant="ghost" className={styles.microsoftButton} onClick={() => login(searchParams.get("continue"))}>
                <span className={styles.microsoftLogo} aria-hidden="true"><i /><i /><i /><i /></span>
                Continuar con Microsoft
            </Button>}
            {providers?.moodle && <Button type="button" fullWidth variant="ghost" className={styles.moodleButton} onClick={openMoodleLogin}>
                <img className={styles.moodleLogo} src="/moodle-riwi.svg" alt="" aria-hidden="true" />
                Continuar con Moodle
            </Button>}
            </>}
        </>
    );
}

export default AuthPage;
