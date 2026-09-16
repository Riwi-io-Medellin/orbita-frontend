import { CaretDown, Check } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AppRole } from "../services/appRegistryService";
import styles from "./RoleAssignmentDropdown.module.css";

interface AssignedRole {
    role_id: string;
    role_name: string;
}

interface RoleAssignmentDropdownProps {
    userName: string;
    roles: AppRole[];
    assignedRoles: AssignedRole[];
    singleRole: boolean;
    disabled?: boolean;
    onSelect: (roleId: string) => void;
    onClear: () => void;
}

function RoleAssignmentDropdown({ userName, roles, assignedRoles, singleRole, disabled = false, onSelect, onClear }: RoleAssignmentDropdownProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const menuId = useId();
    const [menuPosition, setMenuPosition] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);
    const assignedIds = new Set(assignedRoles.map((role) => role.role_id));
    const triggerLabel = assignedRoles.length === 0
        ? "Asignar rol"
        : assignedRoles.length === 1 ? assignedRoles[0].role_name : `${assignedRoles.length} roles asignados`;

    function positionMenu() {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const width = Math.min(280, window.innerWidth - 16);
        const opensUp = rect.top > window.innerHeight / 2;
        setMenuPosition({
            ...(opensUp ? { bottom: window.innerHeight - rect.top + 7 } : { top: rect.bottom + 7 }),
            left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
            width,
        });
    }

    useEffect(() => {
        if (!open) return;
        function closeOutside(event: MouseEvent) {
            if (event.target instanceof Node && !rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
        }
        document.addEventListener("mousedown", closeOutside);
        return () => document.removeEventListener("mousedown", closeOutside);
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const reposition = () => positionMenu();
        positionMenu();
        window.addEventListener("resize", reposition);
        window.addEventListener("scroll", reposition, true);
        return () => {
            window.removeEventListener("resize", reposition);
            window.removeEventListener("scroll", reposition, true);
        };
    }, [open]);

    function choose(roleId: string) {
        onSelect(roleId);
        setOpen(false);
    }

    return (
        <div ref={rootRef} className={styles.root}>
            <button ref={triggerRef} type="button" className={[styles.trigger, open ? styles.open : ""].filter(Boolean).join(" ")} aria-label={`Roles de ${userName}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={menuId} disabled={disabled} onClick={() => { if (!open) positionMenu(); else setMenuPosition(null); setOpen((value) => !value); }}>
                <span>{triggerLabel}</span>
                <CaretDown size={17} weight="bold" aria-hidden="true" />
            </button>
            {open && menuPosition && createPortal(<div ref={menuRef} id={menuId} className={styles.menu} style={menuPosition} role="listbox" aria-label={`Roles de ${userName}`}>
                <button type="button" role="option" aria-selected={assignedRoles.length === 0} className={styles.clearOption} onClick={() => { onClear(); setOpen(false); }}>Sin acceso</button>
                {roles.map((role) => {
                    const assigned = assignedIds.has(role.id);
                    return <button key={role.id} type="button" role="option" aria-selected={assigned} className={[styles.option, assigned ? styles.selected : ""].filter(Boolean).join(" ")} onClick={() => choose(role.id)}>
                        <span>{role.display_name}</span>
                        {assigned && <Check size={16} weight="bold" aria-hidden="true" />}
                    </button>;
                })}
                <p className={styles.help}>{singleRole ? "Solo se puede asignar un rol." : "Puedes asignar más de un rol."}</p>
            </div>, document.body)}
        </div>
    );
}

export default RoleAssignmentDropdown;
