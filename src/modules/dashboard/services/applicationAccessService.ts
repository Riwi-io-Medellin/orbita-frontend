import { apiFetch } from "../../../services/apiConfig";

export async function registerApplicationAccess(applicationId: string): Promise<void> {
    await apiFetch(`/applications/${applicationId}/access`, { method: "POST" });
}
