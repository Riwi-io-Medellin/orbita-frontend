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

export interface AuditLogParams {
    limit?: number;
    offset?: number;
}

export async function getAuditLogs({ limit = 10, offset = 0 }: AuditLogParams = {}): Promise<AuditLog[]> {
    const query = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const response = await apiFetch(`/applications/audit?${query.toString()}`);
    if (!response.ok) {
        throw new Error("No se pudo cargar la auditoría.");
    }
    return response.json();
}
