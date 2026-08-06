import { useNavigate } from "react-router";
import Brand from "../../../components/Brand";
import Button from "../../../components/Button";
import styles from "./NotFoundPage.module.css";

function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className={styles.page}>
            <Brand size="lg" withCaption />
            <p className={styles.code}>404</p>
            <p className={styles.message}>La página que buscas no existe.</p>
            <Button onClick={() => navigate("/auth")}>Volver al inicio</Button>
        </div>
    );
}

export default NotFoundPage;
