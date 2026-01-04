'use client';

import { Skeleton } from '@/components/ui';

export function ShopLoadingState() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="group relative h-full flex flex-col">
          <div className="relative w-full aspect-[3/4] overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="mt-4 flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="ml-2 flex-shrink-0">
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
          <div className="mt-4">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

