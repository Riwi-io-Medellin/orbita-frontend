import { Outlet } from "react-router";
import Avatar from "../components/Avatar";
import Brand from "../components/Brand";
import { useAuth } from "../modules/auth/hooks/useAuth";
import styles from "./DashboardLayout.module.css";

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function DashboardLayout() {
    const { user } = useAuth();

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <Brand size="sm" to="/apps" />

                {user && (
                    <div className={styles.user}>
                        <div className={styles.userInfo}>
                            <div className={styles.userName}>{user.name}</div>
                            <div className={styles.userRole}>{user.role}</div>
                        </div>
                        <Avatar initials={getInitials(user.name)} />
                    </div>
                )}
            </header>

            <main className={styles.main}>
                <Outlet />
            </main>
        </div>
    );
}

export default DashboardLayout;
