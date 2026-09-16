import type { ReactNode } from "react";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
    title: string;
    description: string;
    actions?: ReactNode;
    className?: string;
}

function PageHeader({ title, description, actions, className }: PageHeaderProps) {
    return (
        <header className={[styles.header, className].filter(Boolean).join(" ")}>
            <div>
                <h1>{title}</h1>
                <p>{description}</p>
            </div>
            {actions && <div className={styles.actions}>{actions}</div>}
        </header>
    );
}

export default PageHeader;
