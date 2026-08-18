import {
    AppWindow,
    Code,
    Fingerprint,
    Folder,
    GitBranch,
    Phone,
    Sparkle,
    UsersThree,
} from "@phosphor-icons/react";

interface ApplicationIconProps {
    name: string | null;
}

function ApplicationIcon({ name }: ApplicationIconProps) {
    const props = { size: 30, weight: "bold" as const, "aria-hidden": true };

    switch (name) {
        case "phone":
        case "riwi-calls":
            return <Phone {...props} />;
        case "git-branch":
        case "riwi-match":
            return <GitBranch {...props} />;
        case "folder":
        case "teamup":
            return <Folder {...props} />;
        case "users":
        case "teamlead":
            return <UsersThree {...props} />;
        case "code":
        case "auto-evaluator":
            return <Code {...props} />;
        case "fingerprint":
        case "adku":
            return <Fingerprint {...props} />;
        case "sparkle":
            return <Sparkle {...props} />;
        default:
            return <AppWindow {...props} />;
    }
}

export default ApplicationIcon;
