import styles from "./EmptyState.module.css";

interface EmptyStateProps {
    title: string;
    description?: string;
}

function EmptyState({ title, description }: EmptyStateProps) {
    return (
        <div className={styles.state}>
            <p className={styles.title}>{title}</p>
            {description && <p className={styles.description}>{description}</p>}
        </div>
    );
}

export default EmptyState;
