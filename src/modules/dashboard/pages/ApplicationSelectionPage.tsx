import EmptyState from "../../../components/EmptyState";
import AppCard from "../components/AppCard";
import styles from "./ApplicationSelectionPage.module.css";

const apps = [
    {
        title: "TeamUp",
        description: "Gestión de eventos, equipos, evaluaciones y votación en vivo.",
        icon: "📊",
        to: "/dashboard",
    },
    {
        title: "Riwi Calls",
        description: "Llamadas con IA para conectar con futuros Coders.",
        to: "/dashboard",
    },
    {
        title: "TeamUp",
        description: "Gestión de eventos, equipos, evaluaciones y votación en vivo.",
        to: "/dashboard",
    },
    {
        title: "TeamUp",
        description: "Gestión de eventos, equipos, evaluaciones y votación en vivo.",
        to: "/dashboard",
    },
    {
        title: "TeamUp",
        description: "Gestión de eventos, equipos, evaluaciones y votación en vivo.",
        to: "/dashboard",
    },
    {
        title: "TeamUp",
        description: "Gestión de eventos, equipos, evaluaciones y votación en vivo.",
        to: "/dashboard",
    },
];

function ApplicationSelectionPage() {
    return (
        <div>
            <div className={styles.hero}>
                <h1 className={styles.title}>Bienvenido a Órbita</h1>
                <p className={styles.subtitle}>Tu puerta de entrada a todos los sistemas de Riwi.</p>
            </div>

            <hr className={styles.divider} />

            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Aplicaciones</h2>
                <p className={styles.sectionSubtitle}>Elige un sistema para comenzar</p>
            </div>

            {apps.length === 0 ? (
                <EmptyState
                    title="No hay aplicaciones disponibles"
                    description="Vuelve más tarde para ver los sistemas de Riwi."
                />
            ) : (
                <div className={styles.grid}>
                    {apps.map((app, index) => (
                        <AppCard key={index} {...app} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default ApplicationSelectionPage;
