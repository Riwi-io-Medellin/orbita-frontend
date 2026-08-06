import type { ButtonHTMLAttributes } from "react";
import Spinner from "./Spinner";
import styles from "./Button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "ghost";
    fullWidth?: boolean;
    loading?: boolean;
}

function Button({
    variant = "primary",
    fullWidth = false,
    loading = false,
    disabled,
    className,
    children,
    ...props
}: ButtonProps) {
    const classes = [
        styles.button,
        styles[variant],
        fullWidth ? styles.fullWidth : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <button className={classes} disabled={disabled || loading} {...props}>
            {loading && <Spinner size="sm" />}
            {children}
        </button>
    );
}

export default Button;
