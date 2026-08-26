import { Outlet, useLocation } from "react-router";
import Brand from "../components/Brand";
import { useAuth } from "../modules/auth/hooks/useAuth";
import DashboardNav from "./DashboardNav";
import UserMenu from "./UserMenu";
import styles from "./DashboardLayout.module.css";

function DashboardLayout() {
    const { user, isAdmin } = useAuth();
    const { pathname } = useLocation();
    const isApplicationLauncher = pathname === "/apps";

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.navigationGroup}>
                    <Brand size="sm" iconOnly to="/apps" />
                    <DashboardNav isAdmin={isAdmin} />
                    {user && <div className={styles.userBox}><UserMenu user={user} /></div>}
                </div>
            </header>

            <main className={[styles.main, isApplicationLauncher ? styles.launcherMain : ""].join(" ")}>
                <Outlet />
            </main>
        </div>
    );
}

export default DashboardLayout;
