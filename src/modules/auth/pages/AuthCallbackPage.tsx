import { Navigate, useNavigate, useSearchParams } from "react-router";
import Button from "../../../components/Button";
import ErrorMessage from "../../../components/ErrorMessage";

const ERROR_MESSAGES: Record<string, string> = {
    authentication_failed: "No se pudo iniciar sesión con Microsoft.",
};

// Single landing spot for both OAuth outcomes: backend redirects here on
// success (cookie already set, we just forward into the app) and on
// failure with ?error=<reason> (we show a message and bounce back).
function AuthCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const error = searchParams.get("error");

    if (error) {
        const message = ERROR_MESSAGES[error] ?? "No se pudo iniciar sesión.";

        return (
            <>
                <ErrorMessage message={message} />
                <Button fullWidth onClick={() => navigate("/auth", { replace: true })}>
                    Volver a iniciar sesión
                </Button>
            </>
        );
    }

    return <Navigate to="/apps" replace />;
}

export default AuthCallbackPage;
