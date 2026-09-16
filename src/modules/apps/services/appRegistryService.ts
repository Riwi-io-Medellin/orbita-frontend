import { apiFetch, parseApiError } from "../../../services/apiConfig";

export interface App {
    id: string;
    application_id: string | null;
    client_id: string;
    name: string;
    is_active: boolean;
    role_cardinality: "single" | "multiple";
    migration_access_enabled: boolean;
    jit_role_adoption_enabled: boolean;
    released_claims: string[];
}

// Only returned once, by createApp — the backend stores just a hash of it
// afterward and can never show it again.
export interface AppCreated extends App {
    client_secret: string;
}

export interface AppSecretRotated extends App {
    /** Returned once; replace it in the consuming application's secret store immediately. */
    client_secret: string;
    previous_secret_expires_at: string;
}

export interface CreateAppPayload {
    client_id: string;
    slug: string;
    name: string;
    description: string;
    url: string;
    icon?: string | null;
    role_cardinality?: "single" | "multiple";
    migration_access_enabled?: boolean;
    jit_role_adoption_enabled?: boolean;
    released_claims?: string[];
}

export interface RedirectUri {
    id: string;
    redirect_uri: string;
}

export interface AppRole {
    id: string;
    app_id: string;
    /** Stable key emitted in the app JWT. */
    name: string;
    display_name: string;
    description: string | null;
    is_active: boolean;
    managed_by_app: boolean;
}

export interface ListAppsParams {
    limit: number;
    offset: number;
    is_active?: boolean;
}

function encodeClientId(clientId: string): string {
    return encodeURIComponent(clientId);
}

export async function createApp(payload: CreateAppPayload): Promise<AppCreated> {
    const response = await apiFetch("/apps/", {
        method: "POST",
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudo registrar la aplicación."));
    }
    return response.json();
}

export async function listApps(params: ListAppsParams): Promise<App[]> {
    const query = new URLSearchParams();
    query.set("limit", String(params.limit));
    query.set("offset", String(params.offset));
    if (params.is_active !== undefined) query.set("is_active", String(params.is_active));

    const response = await apiFetch(`/apps/?${query.toString()}`);
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudieron cargar las aplicaciones registradas."));
    }
    return response.json();
}

export async function updateAppStatus(clientId: string, isActive: boolean): Promise<App> {
    const response = await apiFetch(`/apps/${encodeClientId(clientId)}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: isActive }),
    });
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudo actualizar el estado de la aplicación."));
    }
    return response.json();
}

export async function rotateAppSecret(clientId: string): Promise<AppSecretRotated> {
    const response = await apiFetch(`/apps/${encodeClientId(clientId)}/rotate-secret`, { method: "POST" });
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudo rotar el secreto de la aplicación."));
    }
    return response.json();
}

export async function addRedirectUri(clientId: string, redirectUri: string): Promise<RedirectUri> {
    const response = await apiFetch(`/apps/${encodeClientId(clientId)}/redirect-uris`, {
        method: "POST",
        body: JSON.stringify({ redirect_uri: redirectUri }),
    });
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudo registrar el redirect URI."));
    }
    return response.json();
}

export async function addPostLogoutUri(clientId: string, postLogoutUri: string): Promise<void> {
    const response = await apiFetch(`/apps/${encodeClientId(clientId)}/post-logout-uris`, {
        method: "POST",
        body: JSON.stringify({ post_logout_uri: postLogoutUri }),
    });
    if (!response.ok) throw new Error(await parseApiError(response, "No se pudo registrar la URI de logout."));
}

export async function updateAppPolicy(clientId: string, policy: Pick<App, "role_cardinality" | "migration_access_enabled" | "jit_role_adoption_enabled" | "released_claims">): Promise<App> {
    const response = await apiFetch(`/apps/${encodeClientId(clientId)}/policy`, {
        method: "PUT",
        body: JSON.stringify(policy),
    });
    if (!response.ok) throw new Error(await parseApiError(response, "No se pudo actualizar la política SSO."));
    return response.json();
}

export async function upsertGlobalRoleMapping(clientId: string, globalRole: string, appRole: string): Promise<void> {
    const response = await apiFetch(`/apps/${encodeClientId(clientId)}/global-role-mapping`, {
        method: "PUT",
        body: JSON.stringify({ global_role: globalRole, app_role: appRole }),
    });
    if (!response.ok) throw new Error(await parseApiError(response, "No se pudo guardar el mapeo de rol."));
}

export async function listAppRoles(clientId: string): Promise<AppRole[]> {
    const response = await apiFetch(`/apps/${encodeClientId(clientId)}/roles`);
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudieron cargar los roles de la aplicación."));
    }
    return response.json();
}

export async function createAppRole(clientId: string, name: string): Promise<AppRole> {
    const response = await apiFetch(`/apps/${encodeClientId(clientId)}/roles`, {
        method: "POST",
        body: JSON.stringify({ name }),
    });
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudo crear el rol."));
    }
    return response.json();
}

export async function deleteAppRole(clientId: string, roleId: string): Promise<void> {
    const response = await apiFetch(`/apps/${encodeClientId(clientId)}/roles/${roleId}`, { method: "DELETE" });
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudo eliminar el rol."));
    }
}

export async function assignAppRole(clientId: string, roleId: string, userId: string): Promise<void> {
    const response = await apiFetch(`/apps/${encodeClientId(clientId)}/roles/${roleId}/assign`, {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
    });
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudo asignar el rol al usuario."));
    }
}

export async function unassignAppRole(clientId: string, roleId: string, userId: string): Promise<void> {
    const response = await apiFetch(
        `/apps/${encodeClientId(clientId)}/roles/${roleId}/assign?user_id=${encodeURIComponent(userId)}`,
        { method: "DELETE" },
    );
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudo quitar el rol del usuario."));
    }
}

export interface BulkAppRoleResult {
    updated_user_ids: string[];
    not_found_ids: string[];
}

export async function bulkAssignAppRole(clientId: string, roleId: string, userIds: string[]): Promise<BulkAppRoleResult> {
    const response = await apiFetch(`/apps/${encodeClientId(clientId)}/roles/${roleId}/assign/bulk`, {
        method: "POST",
        body: JSON.stringify({ user_ids: userIds }),
    });
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudo asignar el rol a los usuarios seleccionados."));
    }
    return response.json();
}

export async function bulkUnassignAppRole(clientId: string, roleId: string, userIds: string[]): Promise<BulkAppRoleResult> {
    const response = await apiFetch(`/apps/${encodeClientId(clientId)}/roles/${roleId}/unassign/bulk`, {
        method: "POST",
        body: JSON.stringify({ user_ids: userIds }),
    });
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudo quitar el rol de los usuarios seleccionados."));
    }
    return response.json();
}

// --- Role-assignment rows for one app (GET /apps/{client_id}/users) -------
// One row per (user, role) pair. A role is the only access grant for an SSO app.

export interface AppRoleAssignmentRow {
    user_id: string;
    email: string;
    full_name: string;
    role_id: string;
    role_name: string;
}

export interface ListAppUsersParams {
    limit: number;
    offset: number;
}

export async function listAppUsers(clientId: string, params: ListAppUsersParams): Promise<AppRoleAssignmentRow[]> {
    const query = new URLSearchParams();
    query.set("limit", String(params.limit));
    query.set("offset", String(params.offset));
    const response = await apiFetch(`/apps/${encodeClientId(clientId)}/users?${query.toString()}`);
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudieron cargar los usuarios con rol en esta aplicación."));
    }
    return response.json();
}

export interface AppUserWithRoles {
    user_id: string;
    email: string;
    full_name: string;
    roles: { role_id: string; role_name: string }[];
}

// Rows come one-per-(user,role); group client-side for a one-row-per-user table.
export function groupAppUsersByUser(rows: AppRoleAssignmentRow[]): AppUserWithRoles[] {
    const byUser = new Map<string, AppUserWithRoles>();
    for (const row of rows) {
        const existing = byUser.get(row.user_id);
        if (existing) {
            existing.roles.push({ role_id: row.role_id, role_name: row.role_name });
        } else {
            byUser.set(row.user_id, {
                user_id: row.user_id,
                email: row.email,
                full_name: row.full_name,
                roles: [{ role_id: row.role_id, role_name: row.role_name }],
            });
        }
    }
    return [...byUser.values()];
}

// --- Catalog-only direct grants (target = catalog application_id, not client_id) ---
// These endpoints intentionally reject SSO apps. For an App in this module, use
// assignAppRole/bulkAssignAppRole: an app-scoped role grants both visibility and SSO access.

export interface BulkVisibilityResult {
    updated_user_ids: string[];
    not_found_ids: string[];
}

function encodeId(id: string): string {
    return encodeURIComponent(id);
}

export async function grantVisibility(applicationId: string, userId: string): Promise<void> {
    const response = await apiFetch(`/users/${encodeId(userId)}/applications/${encodeId(applicationId)}`, { method: "POST" });
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudo otorgar visibilidad de la aplicación."));
    }
}

export async function revokeVisibility(applicationId: string, userId: string): Promise<void> {
    const response = await apiFetch(`/users/${encodeId(userId)}/applications/${encodeId(applicationId)}`, { method: "DELETE" });
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudo quitar la visibilidad de la aplicación."));
    }
}

export async function bulkGrantVisibility(applicationId: string, userIds: string[]): Promise<BulkVisibilityResult> {
    const response = await apiFetch(`/users/bulk/applications/${encodeId(applicationId)}/grant`, {
        method: "POST",
        body: JSON.stringify({ user_ids: userIds }),
    });
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudo otorgar visibilidad a los usuarios seleccionados."));
    }
    return response.json();
}

export async function bulkRevokeVisibility(applicationId: string, userIds: string[]): Promise<BulkVisibilityResult> {
    const response = await apiFetch(`/users/bulk/applications/${encodeId(applicationId)}/revoke`, {
        method: "POST",
        body: JSON.stringify({ user_ids: userIds }),
    });
    if (!response.ok) {
        throw new Error(await parseApiError(response, "No se pudo quitar visibilidad a los usuarios seleccionados."));
    }
    return response.json();
}
