"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/utils/api";
import { Policy, PolicyType } from "@/types";
import { useToast } from "@/contexts";
import { LoadingSpinner, Modal } from "@/components/ui";
import { Plus, Edit2, Eye, Save, X } from "lucide-react";

const policyTypes: PolicyType[] = ["refund", "return", "terms", "privacy", "shipping"];

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [previewPolicy, setPreviewPolicy] = useState<Policy | null>(null);
  const [formData, setFormData] = useState({
    type: "" as PolicyType | "",
    title: "",
    content: "",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/admin/policies");
      setPolicies(res.data.policies || []);
    } catch (error) {
      console.error("Failed to fetch policies:", error);
      showToast("Failed to load policies", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePolicy = () => {
    setEditingPolicy(null);
    setFormData({
      type: "" as PolicyType | "",
      title: "",
      content: "",
      isActive: true,
    });
  };

  const handleEditPolicy = (policy: Policy) => {
    setEditingPolicy(policy);
    setFormData({
      type: policy.type,
      title: policy.title,
      content: policy.content,
      isActive: policy.isActive,
    });
  };

  const handleSavePolicy = async () => {
    if (!formData.type || !formData.title || !formData.content) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    try {
      setSaving(true);
      if (editingPolicy) {
        await apiFetch(`/admin/policies/${editingPolicy.id}`, {
          method: "PUT",
          body: formData,
        });
        showToast("Policy updated successfully", "success");
      } else {
        await apiFetch("/admin/policies", {
          method: "POST",
          body: formData,
        });
        showToast("Policy created successfully", "success");
      }
      await fetchPolicies();
      setEditingPolicy(null);
      setFormData({
        type: "" as PolicyType | "",
        title: "",
        content: "",
        isActive: true,
      });
    } catch (error: any) {
      console.error("Failed to save policy:", error);
      showToast(error?.message || "Failed to save policy", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (policyId: number) => {
    try {
      await apiFetch(`/admin/policies/${policyId}/toggle`, {
        method: "PATCH",
      });
      showToast("Policy status updated", "success");
      await fetchPolicies();
    } catch (error) {
      console.error("Failed to toggle policy:", error);
      showToast("Failed to update policy status", "error");
    }
  };

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
          Policies
        </h1>
        <button
          onClick={handleCreatePolicy}
          className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold hover:opacity-80"
        >
          <Plus size={18} />
          Create Policy
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {policyTypes.map((type) => {
          const policy = policies.find(p => p.type === type);
          return (
            <div
              key={type}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold capitalize">{type} Policy</h3>
                {policy && (
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    policy.isActive 
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}>
                    {policy.isActive ? "Active" : "Inactive"}
                  </span>
                )}
              </div>
              {policy ? (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {policy.title}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPolicy(policy)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => setPreviewPolicy(policy)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(policy.id)}
                      className={`px-3 py-2 rounded-lg font-bold ${
                        policy.isActive
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      }`}
                    >
                      {policy.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-500">No policy created yet</p>
                  <button
                    onClick={() => {
                      setFormData({
                        type,
                        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Policy`,
                        content: "",
                        isActive: true,
                      });
                      setEditingPolicy(null);
                    }}
                    className="w-full px-3 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold hover:opacity-80"
                  >
                    Create
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingPolicy || formData.type ? (
        <Modal
          isOpen={true}
          onClose={() => {
            setEditingPolicy(null);
            setFormData({
              type: "" as PolicyType | "",
              title: "",
              content: "",
              isActive: true,
            });
          }}
          title={editingPolicy ? "Edit Policy" : "Create Policy"}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PolicyType })}
                disabled={!!editingPolicy}
                className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
              >
                <option value="">Select type</option>
                {policyTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Content (HTML supported)</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={12}
                className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 font-mono text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-sm font-bold">Active</label>
            </div>
            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={handleSavePolicy}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold hover:opacity-80 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditingPolicy(null);
                  setFormData({
                    type: "" as PolicyType | "",
                    title: "",
                    content: "",
                    isActive: true,
                  });
                }}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {previewPolicy && (
        <Modal
          isOpen={!!previewPolicy}
          onClose={() => setPreviewPolicy(null)}
          title={previewPolicy.title}
        >
          <div className="prose dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: previewPolicy.content }} />
          </div>
        </Modal>
      )}
    </div>
  );
}

