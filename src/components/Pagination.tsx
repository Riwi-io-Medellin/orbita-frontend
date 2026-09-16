import Button from "./Button";
import styles from "./Pagination.module.css";

interface PaginationProps {
    limit: number;
    offset: number;
    // Backend list endpoints return a plain array with no total count, so
    // "is there a next page" is inferred from whether this page came back
    // full (itemCount === limit) rather than from an exact total.
    itemCount: number;
    onPageChange: (offset: number) => void;
}

function Pagination({ limit, offset, itemCount, onPageChange }: PaginationProps) {
    const hasPrevious = offset > 0;
    const hasNext = itemCount === limit;

    if (!hasPrevious && !hasNext) {
        return null;
    }

    const from = itemCount === 0 ? 0 : offset + 1;
    const to = offset + itemCount;

    return (
        <div className={styles.pagination}>
            <span className={styles.summary}>{from}–{to}</span>

            <div className={styles.controls}>
                <Button
                    type="button"
                    variant="ghost"
                    disabled={!hasPrevious}
                    onClick={() => onPageChange(Math.max(0, offset - limit))}
                >
                    Anterior
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    disabled={!hasNext}
                    onClick={() => onPageChange(offset + limit)}
                >
                    Siguiente
                </Button>
            </div>
        </div>
    );
}

export default Pagination;
