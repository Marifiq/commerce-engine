"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/utils/api";
import { Refund } from "@/types/refund";
import { useToast } from "@/contexts";
import { LoadingSpinner, Modal, Pagination } from "@/components/ui";
import { Search, Eye, CheckCircle, X, Clock, DollarSign } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  processed: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
};

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const { showToast } = useToast();

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchRefunds();
  }, [statusFilter]);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      
      const res = await apiFetch(`/admin/refunds?${params.toString()}`);
      setRefunds(res.data.refunds || []);
    } catch (error) {
      console.error("Failed to fetch refunds:", error);
      showToast("Failed to load refunds", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (refundId: number, status: string, adminNotes?: string) => {
    try {
      setProcessingId(refundId);
      await apiFetch(`/admin/refunds/${refundId}`, {
        method: "PATCH",
        body: { status, adminNotes },
      });
      showToast(`Refund ${status}`, "success");
      await fetchRefunds();
      if (selectedRefund?.id === refundId) {
        const updated = await apiFetch(`/admin/refunds/${refundId}`);
        setSelectedRefund(updated.data.refund);
      }
    } catch (error) {
      console.error("Failed to update refund:", error);
      showToast("Failed to update refund", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleProcessRefund = async (refundId: number) => {
    try {
      setProcessingId(refundId);
      await apiFetch(`/admin/refunds/${refundId}/process`, {
        method: "POST",
      });
      showToast("Refund processed successfully", "success");
      await fetchRefunds();
      if (selectedRefund?.id === refundId) {
        const updated = await apiFetch(`/admin/refunds/${refundId}`);
        setSelectedRefund(updated.data.refund);
      }
    } catch (error) {
      console.error("Failed to process refund:", error);
      showToast("Failed to process refund", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRefunds = refunds.filter(refund => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        refund.orderId.toString().includes(searchLower) ||
        refund.amount.toString().includes(searchLower) ||
        refund.reason?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const paginatedRefunds = filteredRefunds.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">
          Refunds
        </h1>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder="Search by order ID, amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="processed">Processed</option>
        </select>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold">Order ID</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Created</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {paginatedRefunds.map((refund) => (
                <tr key={refund.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3">#{refund.orderId}</td>
                  <td className="px-4 py-3 font-bold">${refund.amount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${statusColors[refund.status]}`}>
                      {refund.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {new Date(refund.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedRefund(refund)}
                      className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(filteredRefunds.length / ITEMS_PER_PAGE)}
        onPageChange={setCurrentPage}
      />

      {selectedRefund && (
        <Modal
          isOpen={!!selectedRefund}
          onClose={() => setSelectedRefund(null)}
          title={`Refund #${selectedRefund.id}`}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-zinc-500">Order ID</label>
              <p className="text-lg font-bold">#{selectedRefund.orderId}</p>
            </div>
            <div>
              <label className="text-sm font-bold text-zinc-500">Amount</label>
              <p className="text-lg font-bold">${selectedRefund.amount.toFixed(2)}</p>
            </div>
            <div>
              <label className="text-sm font-bold text-zinc-500">Status</label>
              <span className={`inline-block px-3 py-1 rounded text-sm font-bold ${statusColors[selectedRefund.status]}`}>
                {selectedRefund.status}
              </span>
            </div>
            {selectedRefund.reason && (
              <div>
                <label className="text-sm font-bold text-zinc-500">Reason</label>
                <p>{selectedRefund.reason}</p>
              </div>
            )}
            {selectedRefund.adminNotes && (
              <div>
                <label className="text-sm font-bold text-zinc-500">Admin Notes</label>
                <p>{selectedRefund.adminNotes}</p>
              </div>
            )}
            <div className="flex gap-2 pt-4 border-t">
              {selectedRefund.status === "pending" && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(selectedRefund.id, "approved")}
                    disabled={processingId === selectedRefund.id}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedRefund.id, "rejected")}
                    disabled={processingId === selectedRefund.id}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}
              {selectedRefund.status === "approved" && (
                <button
                  onClick={() => handleProcessRefund(selectedRefund.id)}
                  disabled={processingId === selectedRefund.id}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
                >
                  Process Refund
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

