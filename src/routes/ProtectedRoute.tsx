import { Navigate, Outlet, useLocation } from "react-router";
import PageLoader from "../components/PageLoader";
import { useAuth } from "../modules/auth/hooks/useAuth";

function ProtectedRoute() {
    const { loading, isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (loading) {
        return <PageLoader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    if (user?.must_change_password && location.pathname !== "/settings") {
        return <Navigate to="/settings" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;
