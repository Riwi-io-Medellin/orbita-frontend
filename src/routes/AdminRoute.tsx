import { Navigate, Outlet } from "react-router";
import PageLoader from "../components/PageLoader";
import { useAuth } from "../modules/auth/hooks/useAuth";

// UX guard only — hides admin routes from non-admins in the SPA shell.
// The backend rejecting non-admin requests on each admin endpoint is the
// real authorization boundary; this never replaces that check.
function AdminRoute() {
    const { loading, isAuthenticated, isAdmin } = useAuth();

    if (loading) {
        return <PageLoader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/apps" replace />;
    }

    return <Outlet />;
}

export default AdminRoute;
