import type { InputHTMLAttributes } from "react";
import styles from "./Checkbox.module.css";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

function Checkbox({ label, id, className, ...props }: CheckboxProps) {
    const input = (
        <input
            id={id}
            type="checkbox"
            className={[styles.checkbox, className].filter(Boolean).join(" ")}
            {...props}
        />
    );

    if (!label) {
        return input;
    }

    return (
        <label className={styles.wrapper} htmlFor={id}>
            {input}
            <span>{label}</span>
        </label>
    );
}

export default Checkbox;
