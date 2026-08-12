import { Link } from "react-router";
import styles from "./Brand.module.css";

interface BrandProps {
    size?: "sm" | "lg";
    withCaption?: boolean;
    iconOnly?: boolean;
    to?: string;
}

function Brand({ size = "sm", withCaption = false, iconOnly = false, to }: BrandProps) {
    const classes = [styles.brand, styles[size], iconOnly ? styles.iconOnly : ""].join(" ");

    const content = (
        <>
            <img className={styles.logo} src="/orbita-logo-white.svg" alt="" />

            {!iconOnly && <span>
                <span className={styles.name}>Órbita</span>
                {withCaption && <span className={styles.caption}>Riwi Systems</span>}
            </span>}
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
