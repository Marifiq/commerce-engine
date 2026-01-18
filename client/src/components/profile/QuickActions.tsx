"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function QuickActions() {
  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
      <div className="space-y-3">
        <Link
          href="/orders"
          className="flex items-center gap-3 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
        >
          <ShoppingBag className="w-5 h-5 text-zinc-400" />
          <div>
            <p className="text-white font-medium">Order History</p>
            <p className="text-xs text-zinc-500">View your past orders</p>
          </div>
        </Link>
      </div>
    </div>
  );
}




