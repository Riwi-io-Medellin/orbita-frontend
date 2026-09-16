import type { InputHTMLAttributes, ReactNode } from "react";
import styles from "./TextField.module.css";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    rightSlot?: ReactNode;
}

function TextField({ label, id, rightSlot, className, ...props }: TextFieldProps) {
    return (
        <div className={styles.field}>
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
                    {...props}
                />

                {rightSlot && <div className={styles.rightSlot}>{rightSlot}</div>}
            </div>
        </div>
    );
}

export default TextField;
