import { NavLink } from "react-router";
import styles from "./DashboardNav.module.css";

interface DashboardNavProps {
    isAdmin: boolean;
}

const items = [
    { to: "/apps", label: "Inicio", icon: "⌂" },
    { to: "/audit", label: "Auditoría", icon: "◷", adminOnly: true },
    { to: "/settings", label: "Configuración", icon: "⚙" },
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
