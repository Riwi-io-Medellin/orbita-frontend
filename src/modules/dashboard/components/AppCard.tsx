import type { MouseEvent } from "react";
import ApplicationIcon from "../../../components/ApplicationIcon";
import { registerApplicationAccess } from "../services/applicationAccessService";
import styles from "./AppCard.module.css";

interface AppCardProps {
    id: string;
    slug: string;
    title: string;
    description: string;
    icon: string | null;
    url: string;
}

function AppCard({ id, slug, title, description, icon, url }: AppCardProps) {
    const isTeamLead = slug === "teamlead";
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
        <a href={url} className={[styles.card, isTeamLead ? styles.teamLead : ""].join(" ")} onClick={handleOpen}>
            <div className={[styles.icon, !icon ? styles.iconPlaceholder : ""].join(" ")}>
                {isTeamLead ? <img className={styles.teamLeadLogo} src="/teamlead-logo.svg" alt="Logo de TeamLead" /> : <ApplicationIcon name={icon} />}
            </div>

            <h3 className={styles.title}>{title}</h3>
            <p className={styles.description}>{description}</p>
        </a>
    );
}

export default AppCard;
