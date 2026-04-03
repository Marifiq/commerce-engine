"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/utils/api";
import { Return } from "@/types/return";
import { useToast } from "@/contexts";
import { LoadingSpinner, Modal, Pagination } from "@/components/ui";
import { Search, Eye, CheckCircle, X, Clock, Package } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  returned: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const { showToast } = useToast();

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchReturns();
  }, [statusFilter]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      
      const res = await apiFetch(`/admin/returns?${params.toString()}`);
      setReturns(res.data.returns || []);
    } catch (error) {
      console.error("Failed to fetch returns:", error);
      showToast("Failed to load returns", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (returnId: number, status: string, trackingNumber?: string, adminNotes?: string) => {
    try {
      setProcessingId(returnId);
      await apiFetch(`/admin/returns/${returnId}`, {
        method: "PATCH",
        body: { status, trackingNumber, adminNotes },
      });
      showToast(`Return ${status}`, "success");
      await fetchReturns();
      if (selectedReturn?.id === returnId) {
        const updated = await apiFetch(`/admin/returns/${returnId}`);
        setSelectedReturn(updated.data.return);
      }
    } catch (error) {
      console.error("Failed to update return:", error);
      showToast("Failed to update return", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteReturn = async (returnId: number) => {
    try {
      setProcessingId(returnId);
      await apiFetch(`/admin/returns/${returnId}/complete`, {
        method: "POST",
      });
      showToast("Return completed successfully", "success");
      await fetchReturns();
      if (selectedReturn?.id === returnId) {
        const updated = await apiFetch(`/admin/returns/${returnId}`);
        setSelectedReturn(updated.data.return);
      }
    } catch (error) {
      console.error("Failed to complete return:", error);
      showToast("Failed to complete return", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredReturns = returns.filter(returnReq => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        returnReq.orderId.toString().includes(searchLower) ||
        returnReq.reason?.toLowerCase().includes(searchLower) ||
        returnReq.trackingNumber?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const paginatedReturns = filteredReturns.slice(
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
          Returns
        </h1>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder="Search by order ID, reason..."
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
          <option value="returned">Returned</option>
        </select>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold">Order ID</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Tracking</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Created</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {paginatedReturns.map((returnReq) => (
                <tr key={returnReq.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3">#{returnReq.orderId}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${statusColors[returnReq.status]}`}>
                      {returnReq.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {returnReq.trackingNumber || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {new Date(returnReq.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedReturn(returnReq)}
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
        totalPages={Math.ceil(filteredReturns.length / ITEMS_PER_PAGE)}
        onPageChange={setCurrentPage}
      />

      {selectedReturn && (
        <Modal
          isOpen={!!selectedReturn}
          onClose={() => setSelectedReturn(null)}
          title={`Return #${selectedReturn.id}`}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-zinc-500">Order ID</label>
              <p className="text-lg font-bold">#{selectedReturn.orderId}</p>
            </div>
            <div>
              <label className="text-sm font-bold text-zinc-500">Status</label>
              <span className={`inline-block px-3 py-1 rounded text-sm font-bold ${statusColors[selectedReturn.status]}`}>
                {selectedReturn.status}
              </span>
            </div>
            {selectedReturn.reason && (
              <div>
                <label className="text-sm font-bold text-zinc-500">Reason</label>
                <p>{selectedReturn.reason}</p>
              </div>
            )}
            {selectedReturn.trackingNumber && (
              <div>
                <label className="text-sm font-bold text-zinc-500">Tracking Number</label>
                <p>{selectedReturn.trackingNumber}</p>
              </div>
            )}
            {selectedReturn.adminNotes && (
              <div>
                <label className="text-sm font-bold text-zinc-500">Admin Notes</label>
                <p>{selectedReturn.adminNotes}</p>
              </div>
            )}
            <div className="flex gap-2 pt-4 border-t">
              {selectedReturn.status === "pending" && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(selectedReturn.id, "approved")}
                    disabled={processingId === selectedReturn.id}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedReturn.id, "rejected")}
                    disabled={processingId === selectedReturn.id}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}
              {selectedReturn.status === "approved" && (
                <button
                  onClick={() => handleCompleteReturn(selectedReturn.id)}
                  disabled={processingId === selectedReturn.id}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
                >
                  Complete Return
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

