import { NavLink } from "react-router";
import { ClockCounterClockwise, GearSix, House, Plugs, Users } from "@phosphor-icons/react";
import styles from "./DashboardNav.module.css";

interface DashboardNavProps {
    isAdmin: boolean;
}

const items = [
    { to: "/apps", label: "Inicio", icon: <House size={21} weight="bold" /> },
    { to: "/users", label: "Usuarios", icon: <Users size={21} weight="bold" />, adminOnly: true },
    { to: "/admin/registry", label: "Apps SSO", icon: <Plugs size={21} weight="bold" />, adminOnly: true },
    { to: "/audit", label: "Auditoría", icon: <ClockCounterClockwise size={21} weight="bold" />, adminOnly: true },
    { to: "/settings", label: "Configuración", icon: <GearSix size={21} weight="bold" /> },
];

function DashboardNav({ isAdmin }: DashboardNavProps) {
    return (
        <nav className={styles.nav} aria-label="Navegación principal">
            {items.filter((item) => !item.adminOnly || isAdmin).map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => [styles.link, isActive ? styles.active : ""].join(" ")}
                >
                    <span className={styles.icon} aria-hidden="true">{item.icon}</span>
                    <span className={styles.label}>{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
}

export default DashboardNav;
