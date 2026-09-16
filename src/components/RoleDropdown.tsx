import { CaretDown, Check } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./RoleDropdown.module.css";

export interface RoleDropdownOption {
    value: string;
    label: string;
}

interface RoleDropdownProps {
    ariaLabel: string;
    value: string;
    placeholder: string;
    options: RoleDropdownOption[];
    disabled?: boolean;
    onChange: (value: string) => void;
}

function RoleDropdown({ ariaLabel, value, placeholder, options, disabled = false, onChange }: RoleDropdownProps) {
    const [open, setOpen] = useState(false);
    const menuId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const selected = options.find((option) => option.value === value);

    useEffect(() => {
        if (!open) return;
        function closeOnOutside(event: MouseEvent) {
            if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
        }
        document.addEventListener("mousedown", closeOnOutside);
        return () => document.removeEventListener("mousedown", closeOnOutside);
    }, [open]);

    function focusOption(index: number) {
        optionRefs.current[Math.max(0, Math.min(index, options.length - 1))]?.focus();
    }

    function openMenu() {
        if (disabled) return;
        setOpen(true);
        window.requestAnimationFrame(() => focusOption(Math.max(0, options.findIndex((option) => option.value === value))));
    }

    function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
        if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openMenu();
        }
    }

    function handleMenuKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
        const currentIndex = optionRefs.current.findIndex((option) => option === document.activeElement);
        if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
            triggerRef.current?.focus();
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            focusOption(currentIndex + 1);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            focusOption(currentIndex - 1);
        } else if (event.key === "Home") {
            event.preventDefault();
            focusOption(0);
        } else if (event.key === "End") {
            event.preventDefault();
            focusOption(options.length - 1);
        }
    }

    return (
        <div ref={rootRef} className={styles.root}>
            <button ref={triggerRef} type="button" className={[styles.trigger, open ? styles.triggerOpen : ""].filter(Boolean).join(" ")} aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} aria-controls={menuId} disabled={disabled} onClick={() => (open ? setOpen(false) : openMenu())} onKeyDown={handleTriggerKeyDown}>
                <span className={selected ? styles.selectedText : styles.placeholder}>{selected?.label ?? placeholder}</span>
                <CaretDown className={open ? styles.caretOpen : ""} size={18} weight="bold" aria-hidden="true" />
            </button>
            {open && <div id={menuId} className={styles.menu} role="listbox" aria-label={ariaLabel} onKeyDown={handleMenuKeyDown}>
                <button type="button" role="option" aria-selected={!value} className={[styles.option, !value ? styles.optionSelected : ""].filter(Boolean).join(" ")} onClick={() => { onChange(""); setOpen(false); }}><span>{placeholder}</span>{!value && <Check size={16} weight="bold" aria-hidden="true" />}</button>
                {options.map((option, index) => <button key={option.value} ref={(element) => { optionRefs.current[index] = element; }} type="button" role="option" aria-selected={option.value === value} className={[styles.option, option.value === value ? styles.optionSelected : ""].filter(Boolean).join(" ")} onClick={() => { onChange(option.value); setOpen(false); }}><span>{option.label}</span>{option.value === value && <Check size={16} weight="bold" aria-hidden="true" />}</button>)}
            </div>}
        </div>
    );
}

export default RoleDropdown;
