import { useState } from "react";
import { ArrowLeft, CaretDown, Translate } from "@phosphor-icons/react";
import { useNavigate, useSearchParams } from "react-router";
import ErrorMessage from "../../../components/ErrorMessage";
import { env } from "../../../config/env";
import { useAuth } from "../hooks/useAuth";
import { moodleLogin, requestMoodlePasswordReset } from "../services/authService";
import styles from "./MoodleLoginPage.module.css";

const MOODLE_LOGO = "/moodle-riwi.svg";
const RIWI_MARK = "/orbita-logo-white.svg";

type Language = "en" | "es";
type ResetIdentifierType = "username" | "email";

const COPY = {
    en: {
        username: "Username", password: "Password", login: "Log in", loggingIn: "Logging in…",
        lostPassword: "Lost password?", returnToOrbita: "Return to Órbita", language: "English",
        resetDescription: "To reset your password, submit your username or your email address below. If we can find you in the database, we will send you an email with instructions to regain access.",
        searchByUsername: "Search by username", usernameLabel: "Username", searchByEmail: "Search by email address",
        emailLabel: "Email address", search: "Search", sending: "Sending…", backToLogin: "Back to login",
        resetSuccessFirst: "If you supplied either a correct username or a unique email address then an email should have been sent to you.",
        resetSuccessSecond: "It contains easy instructions to confirm and complete this password change. If you continue to have difficulty, please contact the site administrator.",
        continue: "Continue",
    },
    es: {
        username: "Usuario", password: "Contraseña", login: "Acceder", loggingIn: "Iniciando sesión…",
        lostPassword: "¿Olvidaste tu contraseña?", returnToOrbita: "Volver a Órbita", language: "Español",
        resetDescription: "Para reajustar su contraseña, envíe su nombre de usuario o su dirección de correo electrónico. Si podemos encontrarlo en la base de datos, le enviaremos un email con instrucciones para poder acceder de nuevo.",
        searchByUsername: "Buscar por nombre de usuario", usernameLabel: "Nombre de usuario", searchByEmail: "Buscar por dirección email",
        emailLabel: "Dirección de correo", search: "Buscar", sending: "Enviando…", backToLogin: "Volver al inicio de sesión",
        resetSuccessFirst: "Si ha suministrado un nombre de usuario correcto o dirección de correo electrónico única, se le debería haber enviado un correo electrónico.",
        resetSuccessSecond: "Contiene instrucciones sencillas para confirmar y completar este cambio de contraseña. Si sigue teniendo problemas, por favor contacte con el administrador del sitio.",
        continue: "Continuar",
    },
};

function MoodleLoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { refreshUser } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [language, setLanguage] = useState<Language>("en");
    const [resetMode, setResetMode] = useState(false);
    const [resetUsername, setResetUsername] = useState("");
    const [resetEmail, setResetEmail] = useState("");
    const [resetSubmitted, setResetSubmitted] = useState(false);
    const [loading, setLoading] = useState<ResetIdentifierType | "login" | null>(null);
    const [error, setError] = useState<string | null>(null);
    const copy = COPY[language];

    function returnToOrbita() {
        const continueUrl = searchParams.get("continue");
        const query = continueUrl ? `?continue=${encodeURIComponent(continueUrl)}` : "";
        navigate(`/auth${query}`);
    }

    function openPasswordReset() {
        setError(null);
        setResetSubmitted(false);
        setResetMode(true);
    }

    function returnToLogin() {
        setError(null);
        setResetSubmitted(false);
        setResetMode(false);
    }

    async function submitPasswordReset(event: React.FormEvent, identifier: string, identifierType: ResetIdentifierType) {
        event.preventDefault();
        setError(null);
        setLoading(identifierType);
        try {
            await requestMoodlePasswordReset(identifier, identifierType);
            setResetSubmitted(true);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "No fue posible solicitar el restablecimiento.");
        } finally {
            setLoading(null);
        }
    }

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        setError(null);
        setLoading("login");
        try {
            await moodleLogin(username, password);
            await refreshUser();
            if (searchParams.get("continue") === "sso") {
                window.location.assign(`${env.apiUrl}/auth/resume`);
                return;
            }
            navigate("/apps", { replace: true });
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "No fue posible iniciar sesión con Moodle.");
        } finally {
            setLoading(null);
        }
    }

    return (
        <main className={styles.page}>
            <header className={styles.topbar}>
                <img className={styles.topbarLogo} src={RIWI_MARK} alt="Riwi" />
                <nav className={styles.navigation} aria-label="Moodle navigation">
                    <button className={styles.language} type="button" onClick={() => setLanguage((current) => current === "en" ? "es" : "en")} aria-label="Cambiar idioma">
                        <Translate size={18} weight="bold" /> {copy.language} <CaretDown size={14} weight="bold" />
                    </button>
                    <button className={styles.loginLink} type="button" onClick={resetMode ? returnToLogin : returnToOrbita}>{copy.login}</button>
                </nav>
            </header>
            <section className={styles.content} aria-labelledby="moodle-login-title">
                {resetMode && resetSubmitted ? (
                    <div className={styles.resetSuccessCard}>
                        <h1 id="moodle-login-title" className={styles.visuallyHidden}>{copy.lostPassword}</h1>
                        <p>{copy.resetSuccessFirst}</p>
                        <p>{copy.resetSuccessSecond}</p>
                        <button className={styles.continueButton} type="button" onClick={returnToLogin}>{copy.continue}</button>
                    </div>
                ) : resetMode ? (
                    <div className={styles.resetCard}>
                        <h1 id="moodle-login-title" className={styles.visuallyHidden}>{copy.lostPassword}</h1>
                        <p className={styles.resetDescription}>{copy.resetDescription}</p>
                        {error && <ErrorMessage message={error} />}
                        <form className={styles.resetSection} onSubmit={(event) => submitPasswordReset(event, resetUsername, "username")}>
                            <h2>{copy.searchByUsername}</h2>
                            <label className={styles.resetField} htmlFor="reset-username"><span>{copy.usernameLabel}</span><input id="reset-username" type="text" autoComplete="username" value={resetUsername} onChange={(event) => setResetUsername(event.target.value)} required /></label>
                            <button className={styles.resetButton} type="submit" disabled={loading !== null}>{loading === "username" ? copy.sending : copy.search}</button>
                        </form>
                        <form className={styles.resetSection} onSubmit={(event) => submitPasswordReset(event, resetEmail, "email")}>
                            <h2>{copy.searchByEmail}</h2>
                            <label className={styles.resetField} htmlFor="reset-email"><span>{copy.emailLabel}</span><input id="reset-email" type="email" autoComplete="email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} required /></label>
                            <button className={styles.resetButton} type="submit" disabled={loading !== null}>{loading === "email" ? copy.sending : copy.search}</button>
                        </form>
                    </div>
                ) : (
                    <form className={styles.loginCard} onSubmit={submit}>
                        <h1 id="moodle-login-title" className={styles.visuallyHidden}>Moodle Riwi login</h1>
                        <img className={styles.moodleLogo} src={MOODLE_LOGO} alt="Riwi" />
                        <div className={styles.fields}>
                            <input id="moodle-username" type="text" placeholder={copy.username} autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
                            <input id="moodle-password" type="password" placeholder={copy.password} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                            {error && <ErrorMessage message={error} />}
                            <button className={styles.submitButton} type="submit" disabled={loading !== null}>{loading === "login" ? copy.loggingIn : copy.login}</button>
                            <button className={styles.forgotPassword} type="button" onClick={openPasswordReset}>{copy.lostPassword}</button>
                            <button className={styles.returnToOrbita} type="button" onClick={returnToOrbita}><ArrowLeft size={16} weight="bold" /> {copy.returnToOrbita}</button>
                        </div>
                        <div className={styles.cardRule} />
                    </form>
                )}
            </section>
        </main>
    );
}

export default MoodleLoginPage;
