import { Outlet } from "react-router";
import Card from "../components/Card";
import styles from "./AuthLayout.module.css";

function AuthLayout() {
    return (
        <main className={styles.page}>
            <div className={styles.cardWrapper}>
                <Card>
                    <div className={styles.brandWrapper}>
                        <img src="/orbita-logo-white.svg" alt="Órbita" />
                    </div>
                    <Outlet />
                </Card>
            </div>
        </main>
    );
}

export default AuthLayout;
