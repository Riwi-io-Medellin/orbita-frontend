export interface User {
    id: string;
    name: string;
    email: string;
    role: string | null;
    roles: string[];
    active: boolean;
    must_change_password: boolean;
    is_local_account: boolean;
}
