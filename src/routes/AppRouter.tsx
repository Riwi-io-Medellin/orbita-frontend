import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from "react-router";

import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import AuthPage from "../modules/auth/pages/AuthPage";
import DashboardPage from "../modules/dashboard/pages/dashboard-page.tsx";

function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Authentication */}
                <Route element={<AuthLayout />}>
                    <Route path="/auth" element={<AuthPage />} />
                </Route>

                {/* Application */}
                <Route element={<DashboardLayout />}>
                    <Route
                        path="/dashboard"
                        element={<DashboardPage />}
                    />
                </Route>

                {/* Default route */}
                <Route
                    path="*"
                    element={<Navigate to="/auth" replace />}
                />

            </Routes>
        </BrowserRouter>
    );
}

export default AppRouter;