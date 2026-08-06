import { Outlet } from "react-router";
import Brand from "../components/Brand";
import Card from "../components/Card";
import styles from "./AuthLayout.module.css";

function AuthLayout() {
    return (
        <main className={styles.page}>
            <div className={styles.brandWrapper}>
                <Brand size="lg" withCaption />
            </div>

            <div className={styles.cardWrapper}>
                <Card>
                    <Outlet />
                </Card>
            </div>
        </main>
    );
}

export default AuthLayout;
