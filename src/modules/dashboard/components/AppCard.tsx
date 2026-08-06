import type { ReactNode } from "react";
import { Link } from "react-router";
import styles from "./AppCard.module.css";

interface AppCardProps {
    title: string;
    description: string;
    icon?: ReactNode;
    to: string;
}

function AppCard({ title, description, icon, to }: AppCardProps) {
    return (
        <Link to={to} className={styles.card}>
            <div
                className={[styles.icon, !icon ? styles.iconPlaceholder : ""].join(" ")}
            >
                {icon}
            </div>

            <h3 className={styles.title}>{title}</h3>
            <p className={styles.description}>{description}</p>
        </Link>
    );
}

export default AppCard;
