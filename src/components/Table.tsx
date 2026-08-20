import type { ReactNode } from "react";
import EmptyState from "./EmptyState";
import ErrorMessage from "./ErrorMessage";
import PageLoader from "./PageLoader";
import styles from "./Table.module.css";

interface Column<T> {
    key: string;
    header: ReactNode;
    render: (row: T) => ReactNode;
}

interface TableProps<T> {
    columns: Column<T>[];
    rows: T[];
    getRowId: (row: T) => string;
    loading?: boolean;
    loadingMessage?: string;
    error?: string | null;
    emptyState: { title: string; description?: string };
    onRowClick?: (row: T) => void;
}

function Table<T>({
    columns,
    rows,
    getRowId,
    loading = false,
    loadingMessage,
    error = null,
    emptyState,
    onRowClick,
}: TableProps<T>) {
    if (loading) {
        return <PageLoader message={loadingMessage} />;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    if (rows.length === 0) {
        return <EmptyState title={emptyState.title} description={emptyState.description} />;
    }

    return (
        <div className={styles.tableWrap}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column.key}>{column.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr
                            key={getRowId(row)}
                            className={onRowClick ? styles.clickableRow : undefined}
                            role={onRowClick ? "button" : undefined}
                            tabIndex={onRowClick ? 0 : undefined}
                            onClick={onRowClick ? () => onRowClick(row) : undefined}
                            onKeyDown={
                                onRowClick
                                    ? (event) => {
                                          if (event.key === "Enter" || event.key === " ") {
                                              event.preventDefault();
                                              onRowClick(row);
                                          }
                                      }
                                    : undefined
                            }
                        >
                            {columns.map((column) => (
                                <td key={column.key}>{column.render(row)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Table;
