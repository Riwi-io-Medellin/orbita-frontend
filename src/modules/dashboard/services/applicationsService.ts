import { apiFetch, parseApiError } from "../../../services/apiConfig";
import type { Role } from "../../../types/role";

export interface Application {
    id: string;
    slug: string;
    name: string;
    description: string;
    url: string;
    icon: string | null;
}

export async function getApplications(): Promise<Application[]> {
    const response = await apiFetch("/applications/");
    if (!response.ok) {
        throw new Error("No se pudieron cargar las aplicaciones.");
    }
    return response.json();
}

export async function getGlobalRoles(): Promise<Role[]> {
    const response = await apiFetch("/applications/global-roles");
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudieron cargar los roles."));
    }
    return response.json();
}
