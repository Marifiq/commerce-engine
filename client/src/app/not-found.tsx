import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-zinc-800 mb-4">
            404
          </h1>
          <h2 className="text-3xl font-semibold text-zinc-200 mb-4">
            Something Went Wrong
          </h2>
          <p className="text-zinc-400 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block bg-zinc-100 text-black px-6 py-3 rounded-lg font-medium hover:bg-zinc-200 transition-colors shadow-sm"
          >
            Go Back Home
          </Link>
          <div>
            <Link
              href="/shop"
              className="text-zinc-400 hover:text-zinc-100 underline"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}










