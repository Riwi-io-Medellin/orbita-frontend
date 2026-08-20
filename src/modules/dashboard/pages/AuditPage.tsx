import { useEffect, useState } from "react";
import EmptyState from "../../../components/EmptyState";
import ErrorMessage from "../../../components/ErrorMessage";
import PageLoader from "../../../components/PageLoader";
import { getAuditLogs, type AuditLog } from "../services/auditService";
import styles from "./AuditPage.module.css";

function formatEvent(event: string) {
    const labels: Record<string, string> = {
        login: "Inicio de sesión",
        "login.success": "Inicio de sesión",
        "login.password_success": "Inicio de sesión",
        "login.password_failed": "Intento de inicio de sesión fallido",
        "application.access": "Ingreso a aplicación",
    };
    return labels[event] ?? event.replaceAll(".", " · ");
}

function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getAuditLogs().then(setLogs).catch(() => setError("No se pudo cargar la auditoría.")).finally(() => setLoading(false));
    }, []);

    return (
        <section className={styles.page}>
            <header className={styles.hero}>
                <p className={styles.eyebrow}>Administración</p>
                <h1>Auditoría</h1>
                <p>Consulta los eventos recientes de acceso y actividad en Órbita.</p>
            </header>

            {loading ? <PageLoader message="Cargando auditoría…" /> : error ? <ErrorMessage message={error} /> : logs.length === 0 ? (
                <EmptyState title="Aún no hay eventos" description="Los accesos y acciones registradas aparecerán aquí." />
            ) : (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead><tr><th>Evento</th><th>Usuario</th><th>Aplicación</th><th>Fecha</th><th>Dirección IP</th></tr></thead>
                        <tbody>{logs.map((log) => (
                            <tr key={log.id}>
                                <td><span className={styles.event}>{formatEvent(log.event)}</span></td>
                                <td><strong>{log.user_name ?? "Sin usuario"}</strong>{log.user_email && <small>{log.user_email}</small>}</td>
                                <td>{log.application_name ?? "—"}</td>
                                <td>{new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(log.created_at))}</td>
                                <td>{log.ip_address ?? "—"}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default AuditPage;
