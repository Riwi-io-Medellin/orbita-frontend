import { useEffect, useState } from "react";
import EmptyState from "../../../components/EmptyState";
import ErrorMessage from "../../../components/ErrorMessage";
import PageLoader from "../../../components/PageLoader";
import AppCard from "../components/AppCard";
import { getApplications, type Application } from "../services/applicationsService";
import styles from "./ApplicationSelectionPage.module.css";

function ApplicationSelectionPage() {
    const [apps, setApps] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getApplications().then(setApps).catch(() => setError("No se pudieron cargar tus aplicaciones.")).finally(() => setLoading(false));
    }, []);

    return (
        <div className={styles.catalog}>
            <div className={styles.hero}>
                <h1 className={styles.title}>Bienvenido a Órbita</h1>
                <p className={styles.subtitle}>Tu puerta de entrada a todos los sistemas de Riwi.</p>
            </div>

            <hr className={styles.divider} />

            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Aplicaciones</h2>
                <p className={styles.sectionSubtitle}>Elige un sistema para comenzar</p>
            </div>

            {loading ? <PageLoader message="Cargando aplicaciones…" /> : error ? <ErrorMessage message={error} /> : apps.length === 0 ? (
                <EmptyState
                    title="No hay aplicaciones disponibles"
                    description="Vuelve más tarde para ver los sistemas de Riwi."
                />
            ) : (
                <div className={styles.grid}>
                    {apps.map((app) => (
                        <AppCard key={app.id} id={app.id} slug={app.slug} title={app.name} description={app.description} icon={app.icon} url={app.url} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default ApplicationSelectionPage;
