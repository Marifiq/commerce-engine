export default function Skeleton({
  className = "",
  variant = "rectangular"
}: {
  className?: string;
  variant?: "rectangular" | "circular" | "text";
}) {
  const baseClasses = "animate-pulse bg-zinc-200 dark:bg-zinc-800";
  
  const variantClasses = {
    rectangular: "rounded",
    circular: "rounded-full",
    text: "rounded"
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      aria-label="Loading..."
    />
  );
}

