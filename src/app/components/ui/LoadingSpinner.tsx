export default function LoadingSpinner({
    className = "",
    size = "default"
}: {
    className?: string,
    size?: "small" | "default" | "large"
}) {
    const sizeClasses = {
        small: "h-4 w-4 border-2",
        default: "h-8 w-8 border-3",
        large: "h-12 w-12 border-4"
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className={`
                ${sizeClasses[size]}
                animate-spin 
                rounded-full 
                border-black/10 
                border-t-black 
                dark:border-white/10 
                dark:border-t-white
            `}>
                <span className="sr-only">Loading...</span>
            </div>
        </div>
    );
}
