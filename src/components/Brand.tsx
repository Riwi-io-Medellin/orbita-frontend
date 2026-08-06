import { Link } from "react-router";
import styles from "./Brand.module.css";

interface BrandProps {
    size?: "sm" | "lg";
    withCaption?: boolean;
    to?: string;
}

function Brand({ size = "sm", withCaption = false, to }: BrandProps) {
    const classes = [styles.brand, styles[size]].join(" ");

    const content = (
        <>
            <span className={styles.badge} aria-hidden="true">
                ⬡
            </span>

            <span>
                <span className={styles.name}>Órbita</span>
                {withCaption && <span className={styles.caption}>Riwi Systems</span>}
            </span>
        </>
    );

    if (!to) {
        return <span className={classes}>{content}</span>;
    }

    return (
        <Link to={to} className={classes}>
            {content}
        </Link>
    );
}

export default Brand;
