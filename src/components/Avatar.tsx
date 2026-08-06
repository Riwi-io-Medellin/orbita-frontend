import styles from "./Avatar.module.css";

interface AvatarProps {
    initials: string;
    size?: "sm" | "md" | "lg";
}

function Avatar({ initials, size = "md" }: AvatarProps) {
    return <div className={[styles.avatar, styles[size]].join(" ")}>{initials}</div>;
}

export default Avatar;
