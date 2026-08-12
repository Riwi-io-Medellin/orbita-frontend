import styles from "./PageLoader.module.css";

interface PageLoaderProps {
    message?: string;
}

function PageLoader({ message = "Cargando…" }: PageLoaderProps) {
    return (
        <div className={styles.page}>
            <img
                className={styles.logo}
                src="/orbita-logo-white.svg"
                alt=""
                role="status"
                aria-label="Cargando"
            />
            <span>{message}</span>
        </div>
    );
}

export default PageLoader;
