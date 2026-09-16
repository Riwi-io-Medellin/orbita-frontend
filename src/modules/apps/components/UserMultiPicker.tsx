import { useEffect, useState } from "react";
import TextField from "../../../components/TextField";
import { listUsers, type AdminUser } from "../../users/services/userService";
import styles from "./UserMultiPicker.module.css";

interface UserMultiPickerProps {
    id: string;
    label: string;
    selected: AdminUser[];
    onChange: (users: AdminUser[]) => void;
    disabled?: boolean;
}

function UserMultiPicker({ id, label, selected, onChange, disabled = false }: UserMultiPickerProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<AdminUser[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (query.trim().length < 2) {
            return;
        }

        const timeout = setTimeout(() => {
            setSearching(true);
            listUsers({ limit: 6, offset: 0, search: query.trim() })
                .then(setResults)
                .catch(() => setResults([]))
                .finally(() => setSearching(false));
        }, 300);

        return () => clearTimeout(timeout);
    }, [query]);

    const selectedIds = new Set(selected.map((u) => u.id));

    return (
        <div className={styles.picker}>
            <TextField
                id={id}
                label={label}
                placeholder="Buscar…"
                value={query}
                disabled={disabled}
                onChange={(e) => setQuery(e.target.value)}
            />

            {selected.length > 0 && (
                <div className={styles.chips}>
                    {selected.map((user) => (
                        <span key={user.id} className={styles.chip}>
                            {user.full_name}
                            <button type="button" disabled={disabled} onClick={() => onChange(selected.filter((u) => u.id !== user.id))}>×</button>
                        </span>
                    ))}
                </div>
            )}

            {query.trim().length >= 2 && (
                <div className={styles.pickerResults}>
                    {searching ? (
                        <span className={styles.pickerHint}>Buscando…</span>
                    ) : results.length === 0 ? (
                        <span className={styles.pickerHint}>Sin coincidencias.</span>
                    ) : (
                        results.map((user) => (
                            <button
                                type="button"
                                key={user.id}
                                className={styles.pickerResult}
                                disabled={selectedIds.has(user.id)}
                                onClick={() => {
                                    onChange([...selected, user]);
                                    setQuery("");
                                }}
                            >
                                <strong>{user.full_name}</strong>
                                <span>{user.email}</span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default UserMultiPicker;
