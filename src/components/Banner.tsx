import styles from "./Banner.module.css";

interface BannerProps {
    variant: "success" | "error" | "warning";
    message: string;
    onDismiss?: () => void;
}

function Banner({ variant, message, onDismiss }: BannerProps) {
    return (
        <div className={[styles.banner, styles[variant]].join(" ")} role={variant === "error" ? "alert" : "status"}>
            <span>{message}</span>
            {onDismiss && (
                <button
                    type="button"
                    className={styles.dismiss}
                    aria-label="Descartar"
                    onClick={onDismiss}
                >
                    ×
                </button>
            )}
        </div>
    );
}

export default Banner;
