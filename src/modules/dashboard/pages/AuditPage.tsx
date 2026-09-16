import { useEffect, useState } from "react";
import EmptyState from "../../../components/EmptyState";
import ErrorMessage from "../../../components/ErrorMessage";
import PageLoader from "../../../components/PageLoader";
import Pagination from "../../../components/Pagination";
import PageHeader from "../../../components/PageHeader";
import { getAuditLogs, type AuditLog } from "../services/auditService";
import styles from "./AuditPage.module.css";

const AUDIT_PAGE_SIZE = 10;

function formatEvent(event: string) {
    const labels: Record<string, string> = {
        login: "Inició sesión",
        "login.local": "Inició sesión con correo",
        "login.moodle": "Inició sesión con Moodle",
        "login.microsoft": "Inició sesión con Microsoft",
        "login.password_success": "Inició sesión con correo",
        "login.password_failed": "Intento de acceso rechazado",
        "login.moodle_failed": "Intento de acceso con Moodle rechazado",
        "login.moodle_unavailable": "Moodle no estuvo disponible",
        "login.inactive": "Intento de acceso de cuenta inactiva",
        "application.access": "Abrió una aplicación",
        "access.app_role_adopted": "Actualizó un rol de aplicación",
        "access.app_policy_updated": "Actualizó la configuración de una aplicación",
        "access.moodle_role_synchronized": "Rol sincronizado desde Moodle",
        register: "Se registró una cuenta",
        "identity.link_conflict": "No se pudo vincular una identidad",
        "moodle.password_reset_requested": "Solicitó recuperar su contraseña",
    };
    return labels[event] ?? "Actividad registrada";
}

function formatDate(value: string) {
    const date = new Date(value);
    const today = new Date();
    const sameDay = date.toDateString() === today.toDateString();
    const time = new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit" }).format(date);
    if (sameDay) return `Hoy, ${time}`;

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return `Ayer, ${time}`;

    const day = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric" }).format(date);
    return `${day}, ${time}`;
}

function isErrorEvent(event: string) {
    return event.includes("failed") || event.includes("conflict") || event === "login.inactive";
}

function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getAuditLogs({ limit: AUDIT_PAGE_SIZE, offset })
            .then(setLogs)
            .catch(() => setError("No se pudo cargar la auditoría."))
            .finally(() => setLoading(false));
    }, [offset]);

    return (
        <section className={styles.page}>
            <PageHeader title="Auditoría" description="Consulta los accesos y cambios recientes en Órbita." />

            {loading ? <PageLoader message="Cargando auditoría…" /> : error ? <ErrorMessage message={error} /> : logs.length === 0 ? (
                <EmptyState title="Aún no hay eventos" description="Los accesos y acciones registradas aparecerán aquí." />
            ) : (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <caption className={styles.tableCaption}>Actividad reciente</caption>
                        <thead><tr><th>Actividad</th><th>Persona</th><th>Aplicación</th><th>Cuándo</th></tr></thead>
                        <tbody>{logs.map((log) => (
                            <tr key={log.id}>
                                <td><span className={[styles.event, isErrorEvent(log.event) ? styles.eventError : ""].filter(Boolean).join(" ")}>{formatEvent(log.event)}</span></td>
                                <td><strong>{log.user_name ?? "Sistema"}</strong>{log.user_email && <small>{log.user_email}</small>}</td>
                                <td>{log.application_name ?? "—"}</td>
                                <td>{formatDate(log.created_at)}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}
            {!loading && !error && logs.length > 0 && <Pagination limit={AUDIT_PAGE_SIZE} offset={offset} itemCount={logs.length} onPageChange={(nextOffset) => { setLoading(true); setError(null); setOffset(nextOffset); }} />}
        </section>
    );
}

export default AuditPage;
