import styles from "./Avatar.module.css";

interface AvatarProps {
    initials: string;
    size?: "sm" | "md" | "lg";
    className?: string;
}

function Avatar({ initials, size = "md", className }: AvatarProps) {
    return <div className={[styles.avatar, styles[size], className].filter(Boolean).join(" ")}>{initials}</div>;
}

export default Avatar;
