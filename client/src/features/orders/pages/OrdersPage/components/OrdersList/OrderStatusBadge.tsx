'use client';

import { CheckCircle, Clock, Truck, XCircle } from 'lucide-react';
import { Order } from '@/types/order';

interface OrderStatusBadgeProps {
  status: string;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-black bg-zinc-100 dark:bg-zinc-800 dark:text-white';
      case 'shipped':
        return 'text-zinc-700 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300';
      case 'processed':
        return 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400';
      case 'cancelled':
        return 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-500';
      default:
        return 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 mr-1.5" />;
      case 'shipped':
        return <Truck className="h-4 w-4 mr-1.5" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 mr-1.5" />;
      default:
        return <Clock className="h-4 w-4 mr-1.5" />;
    }
  };

  const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}
    >
      {getStatusIcon(status)}
      {displayStatus}
    </span>
  );
}

