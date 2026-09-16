import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.css";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

function Modal({ open, onClose, title, children }: ModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    // Only steal focus when the dialog transitions to open — not on every
    // re-render of the parent (an inline onClose would otherwise be a new
    // reference each render, re-running this and yanking focus out of
    // whatever input the user is typing in).
    useEffect(() => {
        if (open) {
            dialogRef.current?.focus();
        }
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onClose();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    return createPortal(
        <div className={styles.backdrop} onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
        }}
        >
            <div
                ref={dialogRef}
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                tabIndex={-1}
            >
                <div className={styles.header}>
                    <h2 id="modal-title" className={styles.title}>{title}</h2>
                    <button
                        type="button"
                        className={styles.closeButton}
                        aria-label="Cerrar"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <div className={styles.content}>{children}</div>
            </div>
        </div>,
        document.body,
    );
}

export default Modal;
