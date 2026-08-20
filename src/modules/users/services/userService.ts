import { apiFetch, parseApiError } from "../../../services/apiConfig";

// Admin listing shape (GET/PATCH/DELETE /users*) — distinct from the session
// User type in src/types/user.ts (which is /auth/me's shape and has no
// full_name/is_active/deleted_at, and no roles here either: this endpoint
// doesn't report a user's current global roles, only lets you grant/revoke).
export interface AdminUser {
    id: string;
    email: string;
    full_name: string;
    is_active: boolean;
    is_platform_admin: boolean;
    deleted_at: string | null;
    created_at: string;
}

export interface ListUsersParams {
    limit: number;
    offset: number;
    is_active?: boolean;
    search?: string;
    include_deleted?: boolean;
}

export interface BulkStatusResult {
    updated: AdminUser[];
    not_found_ids: string[];
}

export interface BulkRoleResult {
    updated_user_ids: string[];
    not_found_ids: string[];
}

function buildQuery(params: ListUsersParams): string {
    const query = new URLSearchParams();
    query.set("limit", String(params.limit));
    query.set("offset", String(params.offset));
    if (params.is_active !== undefined) query.set("is_active", String(params.is_active));
    if (params.search) query.set("search", params.search);
    if (params.include_deleted !== undefined) query.set("include_deleted", String(params.include_deleted));
    return `?${query.toString()}`;
}

export async function listUsers(params: ListUsersParams): Promise<AdminUser[]> {
    const response = await apiFetch(`/users/${buildQuery(params)}`);
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudieron cargar los usuarios."));
    }
    return response.json();
}

export async function bulkUpdateStatus(userIds: string[], isActive: boolean): Promise<BulkStatusResult> {
    const response = await apiFetch("/users/bulk/status", {
        method: "PATCH",
        body: JSON.stringify({ user_ids: userIds, is_active: isActive }),
    });
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudo actualizar el estado de los usuarios seleccionados."));
    }
    return response.json();
}

export async function bulkDeleteUsers(userIds: string[]): Promise<BulkStatusResult> {
    const response = await apiFetch("/users/bulk/delete", {
        method: "POST",
        body: JSON.stringify({ user_ids: userIds }),
    });
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudieron eliminar los usuarios seleccionados."));
    }
    return response.json();
}

export async function bulkGrantRole(roleId: string, userIds: string[]): Promise<BulkRoleResult> {
    const response = await apiFetch(`/users/bulk/global-roles/${roleId}/grant`, {
        method: "POST",
        body: JSON.stringify({ user_ids: userIds }),
    });
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudo asignar el rol a los usuarios seleccionados."));
    }
    return response.json();
}

export async function bulkRevokeRole(roleId: string, userIds: string[]): Promise<BulkRoleResult> {
    const response = await apiFetch(`/users/bulk/global-roles/${roleId}/revoke`, {
        method: "POST",
        body: JSON.stringify({ user_ids: userIds }),
    });
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudo revocar el rol de los usuarios seleccionados."));
    }
    return response.json();
}

export async function updateUserStatus(userId: string, isActive: boolean): Promise<AdminUser> {
    const response = await apiFetch(`/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: isActive }),
    });
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudo actualizar el estado del usuario."));
    }
    return response.json();
}

export async function deleteUser(userId: string): Promise<AdminUser> {
    const response = await apiFetch(`/users/${userId}`, { method: "DELETE" });
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudo eliminar el usuario."));
    }
    return response.json();
}

export async function grantRole(userId: string, roleId: string): Promise<void> {
    const response = await apiFetch(`/users/${userId}/global-roles/${roleId}`, { method: "POST" });
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudo asignar el rol."));
    }
}

export async function revokeRole(userId: string, roleId: string): Promise<void> {
    const response = await apiFetch(`/users/${userId}/global-roles/${roleId}`, { method: "DELETE" });
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudo revocar el rol."));
    }
}

// --- Single-user detail (applications they can see + roles they hold) ----

export interface UserApplication {
    id: string;
    slug: string;
    name: string;
    description: string;
    url: string;
    icon: string | null;
}

// app_id here is the SSO App's own id (from POST /apps/), NOT the catalog
// application_id used in UserApplication.id above — the two response shapes
// share no key. Join client-side by app_name / application.name instead.
export interface UserAppRole {
    app_id: string;
    client_id: string;
    app_name: string;
    role_id: string;
    role_name: string;
}

export async function getUserApplications(userId: string): Promise<UserApplication[]> {
    const response = await apiFetch(`/users/${userId}/applications`);
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudieron cargar las aplicaciones del usuario."));
    }
    return response.json();
}

export async function getUserAppRoles(userId: string): Promise<UserAppRole[]> {
    const response = await apiFetch(`/users/${userId}/app-roles`);
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudieron cargar los roles del usuario."));
    }
    return response.json();
}
