import Spinner from "./Spinner";
import styles from "./PageLoader.module.css";

interface PageLoaderProps {
    message?: string;
}

function PageLoader({ message = "Cargando…" }: PageLoaderProps) {
    return (
        <div className={styles.page}>
            <Spinner />
            <span>{message}</span>
        </div>
    );
}

export default PageLoader;
