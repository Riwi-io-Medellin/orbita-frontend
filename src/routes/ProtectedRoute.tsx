import { Navigate, Outlet } from "react-router";
import PageLoader from "../components/PageLoader";
import { useAuth } from "../modules/auth/hooks/useAuth";

function ProtectedRoute() {
    const { loading, isAuthenticated } = useAuth();

    if (loading) {
        return <PageLoader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;
