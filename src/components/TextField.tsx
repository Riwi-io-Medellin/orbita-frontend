import type { InputHTMLAttributes, ReactNode } from "react";
import styles from "./TextField.module.css";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    rightSlot?: ReactNode;
    hint?: string;
    fieldClassName?: string;
}

function TextField({ label, id, rightSlot, hint, fieldClassName, className, "aria-describedby": ariaDescribedBy, ...props }: TextFieldProps) {
    const hintId = hint && id ? `${id}-hint` : undefined;

    return (
        <div className={[styles.field, fieldClassName].filter(Boolean).join(" ")}>
            <label className={styles.label} htmlFor={id}>
                {label}
            </label>

            <div className={styles.inputWrapper}>
                <input
                    id={id}
                    className={[
                        styles.input,
                        rightSlot ? styles.hasRightSlot : "",
                        className,
                    ]
                        .filter(Boolean)
                        .join(" ")}
                    aria-describedby={hintId ?? ariaDescribedBy}
                    {...props}
                />

                {rightSlot && <div className={styles.rightSlot}>{rightSlot}</div>}
            </div>
            {hint && <p id={hintId} className={styles.hint}>{hint}</p>}
        </div>
    );
}

export default TextField;
