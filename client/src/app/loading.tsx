import { LoadingSpinner } from "@/components/ui";

export default function Loading() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-black">
            <LoadingSpinner size="large" />
        </div>
    );
}
