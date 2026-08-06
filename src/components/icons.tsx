interface IconProps {
    className?: string;
}

export function ChevronLeftIcon({ className }: IconProps) {
    return (
        <svg
            className={className}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M10 12.5 5.5 8 10 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function EyeIcon({ className }: IconProps) {
    return (
        <svg
            className={className}
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M1.5 9s2.727-5.25 7.5-5.25S16.5 9 16.5 9s-2.727 5.25-7.5 5.25S1.5 9 1.5 9Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle
                cx="9"
                cy="9"
                r="2.25"
                stroke="currentColor"
                strokeWidth="1.5"
            />
        </svg>
    );
}

export function EyeOffIcon({ className }: IconProps) {
    return (
        <svg
            className={className}
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M2.25 2.25l13.5 13.5M7.6 7.65a2.25 2.25 0 0 0 3.15 3.13M5.06 5.1C2.9 6.53 1.5 9 1.5 9s2.727 5.25 7.5 5.25c1.36 0 2.532-.43 3.51-1.03M10.6 3.98A7.5 7.5 0 0 0 9 3.75c-4.773 0-7.5 5.25-7.5 5.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
