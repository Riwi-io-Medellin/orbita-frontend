import styles from "./ErrorMessage.module.css";

interface ErrorMessageProps {
    message: string;
}

function ErrorMessage({ message }: ErrorMessageProps) {
    return (
        <p className={styles.message} role="alert">
            {message}
        </p>
    );
}

export default ErrorMessage;
