import { useEffect, useRef, useState } from "react";
import Avatar from "../components/Avatar";
import Button from "../components/Button";
import { ChevronDownIcon } from "../components/icons";
import { useAuth } from "../modules/auth/hooks/useAuth";
import type { User } from "../types/user";
import styles from "./UserMenu.module.css";

interface UserMenuProps {
    user: User;
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function UserMenu({ user }: UserMenuProps) {
    const { logout } = useAuth();
    const [open, setOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        function handleMouseDown(event: MouseEvent) {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOpen(false);
                triggerRef.current?.focus();
            }
        }

        document.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    async function handleLogout() {
        setLoggingOut(true);

        try {
            await logout();
            setOpen(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoggingOut(false);
        }
    }

    return (
        <div className={styles.wrapper} ref={rootRef}>
            <button
                ref={triggerRef}
                type="button"
                className={styles.trigger}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
            >
                <div className={styles.userInfo}>
                    <div className={styles.userName}>{user.name}</div>
                    <div className={styles.userRole}>{user.role}</div>
                </div>
                <Avatar initials={getInitials(user.name)} />
                <ChevronDownIcon
                    className={[styles.chevron, open ? styles.chevronOpen : ""].join(" ")}
                />
            </button>

            {open && (
                <div className={styles.dropdown} role="menu">
                    <div className={styles.dropdownRole}>{user.role}</div>
                    <Button
                        role="menuitem"
                        variant="ghost"
                        fullWidth
                        loading={loggingOut}
                        onClick={handleLogout}
                    >
                        Cerrar sesión
                    </Button>
                </div>
            )}
        </div>
    );
}

export default UserMenu;
