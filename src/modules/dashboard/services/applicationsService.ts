import { apiFetch } from "../../../services/apiConfig";

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
