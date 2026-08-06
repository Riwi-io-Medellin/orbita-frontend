import { Outlet } from "react-router";
import Brand from "../components/Brand";
import { useAuth } from "../modules/auth/hooks/useAuth";
import UserMenu from "./UserMenu";
import styles from "./DashboardLayout.module.css";

function DashboardLayout() {
    const { user } = useAuth();

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <Brand size="sm" to="/apps" />

                {user && <UserMenu user={user} />}
            </header>

            <main className={styles.main}>
                <Outlet />
            </main>
        </div>
    );
}

export default DashboardLayout;
