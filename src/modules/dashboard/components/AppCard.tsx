import type { MouseEvent, ReactNode } from "react";
import { registerApplicationAccess } from "../services/applicationAccessService";
import styles from "./AppCard.module.css";

interface AppCardProps {
    id: string;
    title: string;
    description: string;
    icon?: ReactNode;
    url: string;
}

function AppCard({ id, title, description, icon, url }: AppCardProps) {
    async function handleOpen(event: MouseEvent<HTMLAnchorElement>) {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        event.preventDefault();
        try {
            await registerApplicationAccess(id);
        } catch {
            // El acceso a la aplicación no debe bloquearse si falla el registro de auditoría.
        }
        window.location.assign(url);
    }

    return (
        <a href={url} className={styles.card} onClick={handleOpen}>
            <div className={[styles.icon, !icon ? styles.iconPlaceholder : ""].join(" ")}>
                {icon || title.slice(0, 1)}
            </div>

            <h3 className={styles.title}>{title}</h3>
            <p className={styles.description}>{description}</p>
        </a>
    );
}

export default AppCard;
