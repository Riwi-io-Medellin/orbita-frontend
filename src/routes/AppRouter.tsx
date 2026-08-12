import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from "react-router";

import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import AuthCallbackPage from "../modules/auth/pages/AuthCallbackPage";
import AuthPage from "../modules/auth/pages/AuthPage";
import ApplicationSelectionPage from "../modules/dashboard/pages/ApplicationSelectionPage";
import AuditPage from "../modules/dashboard/pages/AuditPage";
import SettingsPage from "../modules/dashboard/pages/SettingsPage";
import DashboardPage from "../modules/dashboard/pages/dashboard-page.tsx";
import NotFoundPage from "../modules/not-found/pages/NotFoundPage";
import ProtectedRoute from "./ProtectedRoute";

function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Authentication (public) */}
                <Route element={<AuthLayout />}>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/auth/callback" element={<AuthCallbackPage />} />
                </Route>

                {/* Application (protected) */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<DashboardLayout />}>
                        <Route path="/apps" element={<ApplicationSelectionPage />} />
                        <Route path="/audit" element={<AuditPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                    </Route>
                </Route>

                {/* Root entry point */}
                <Route path="/" element={<Navigate to="/auth" replace />} />

                {/* Not found */}
                <Route path="*" element={<NotFoundPage />} />

            </Routes>
        </BrowserRouter>
    );
}

export default AppRouter;
