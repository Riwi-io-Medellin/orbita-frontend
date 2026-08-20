import type { SelectHTMLAttributes } from "react";
import styles from "./Select.module.css";

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: SelectOption[];
    placeholder?: string;
}

function Select({ label, id, options, placeholder, className, ...props }: SelectProps) {
    return (
        <div className={styles.field}>
            {label && (
                <label className={styles.label} htmlFor={id}>
                    {label}
                </label>
            )}

            <select
                id={id}
                className={[styles.select, className].filter(Boolean).join(" ")}
                {...props}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default Select;
