import styles from "./Spinner.module.css";

interface SpinnerProps {
    size?: "sm" | "md";
}

function Spinner({ size = "md" }: SpinnerProps) {
    return <span className={[styles.spinner, styles[size]].join(" ")} role="status" aria-label="Cargando" />;
}

export default Spinner;
