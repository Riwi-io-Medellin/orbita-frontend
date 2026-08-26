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
        <section className={styles.catalog} aria-label="Aplicaciones disponibles">
            {loading ? <PageLoader message="Cargando aplicaciones…" /> : error ? <ErrorMessage message={error} /> : apps.length === 0 ? (
                <EmptyState
                    title="No hay aplicaciones disponibles"
                    description="Vuelve más tarde para ver los sistemas de Riwi."
                />
            ) : (
                <div className={styles.cards}>
                    {apps.map((app) => (
                        <div className={styles.cardSlot} key={app.id}>
                            <AppCard id={app.id} slug={app.slug} title={app.name} description={app.description} icon={app.icon} url={app.url} />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

export default ApplicationSelectionPage;
