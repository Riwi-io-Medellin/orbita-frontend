import { apiFetch } from "../../../services/apiConfig";

export interface AuditLog {
    id: string;
    event: string;
    user_name: string | null;
    user_email: string | null;
    application_name: string | null;
    ip_address: string | null;
    details: Record<string, unknown>;
    created_at: string;
}

export async function getAuditLogs(): Promise<AuditLog[]> {
    const response = await apiFetch("/applications/audit");
    if (!response.ok) {
        throw new Error("No se pudo cargar la auditoría.");
    }
    return response.json();
}
