"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  User,
  Mail,
  Lock,
  MapPin,
  Calendar,
  Trash2,
  Edit2,
  X,
  Key,
} from "lucide-react";
import { RootState } from "@/store/store";
import { profileService } from "@/services/profile.service";
import { useToast } from "@/contexts";
import { Modal } from "@/components/ui";
import Avatar from "@/components/common/Avatar";
import {
  ProfileImageUpload,
  ProfileForm,
  EmailChangeForm,
  PasswordChangeForm,
  PaymentMethods,
} from "@/components/profile";
import QuickActions from "@/components/profile/QuickActions";
import { User as UserType } from "@/types/user";

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser: reduxUser, isAuthenticated } = useSelector(
    (state: RootState) => state.user
  );
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProfileImageModal, setShowProfileImageModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    fetchProfile();
  }, [isAuthenticated, router, mounted]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await profileService.getProfile();
      setUser(response.data.user);
    } catch (error: unknown) {
      console.error("Failed to fetch profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load profile";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (updatedUser: UserType) => {
    setUser(updatedUser);
    // Update Redux store if needed
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await profileService.deleteAccount();
      showToast("Account deleted successfully", "success");
      // Clear local storage and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/");
      // Reload to clear Redux state
      window.location.reload();
    } catch (error: unknown) {
      console.error("Failed to delete account:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete account";
      showToast(errorMessage, "error");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading || !user) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  const formatAddress = () => {
    const parts = [
      user.addressStreet,
      user.addressCity,
      user.addressState,
      user.addressZip,
      user.addressCountry,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "No address on file";
  };

  const formatAccountDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">
            Profile Settings
          </h1>
          <p className="text-zinc-400">Manage your account information and preferences</p>
        </div>

        {/* Profile Header Card */}
        <div className="bg-zinc-900 rounded-2xl p-6 mb-6 border border-zinc-800">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setShowProfileImageModal(true)}
              className="relative group cursor-pointer"
              aria-label="Edit profile image"
            >
              <Avatar user={user} size="xl" />
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Edit2 className="w-6 h-6 text-white" />
              </div>
            </button>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
              <p className="text-zinc-400 mb-2">{user.email}</p>
              {user.createdAt && (
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Calendar className="w-4 h-4" />
                  <span>Member since {formatAccountDate(user.createdAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="bg-zinc-900 rounded-2xl p-6 mb-6 border border-zinc-800">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </h3>
          <ProfileForm user={user} onUpdate={handleUpdate} />
        </div>

        {/* Email Section */}
        <div className="bg-zinc-900 rounded-2xl p-6 mb-6 border border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Address
            </h3>
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors text-sm font-medium text-white"
            >
              <Edit2 className="w-4 h-4" />
              Change Email
            </button>
          </div>
          <div className="space-y-2">
            <p className="text-zinc-300">{user.email}</p>
            <p className="text-xs text-zinc-500">
              To change your email, you'll need to verify your current password
            </p>
          </div>
        </div>

        {/* Address Section */}
        <div className="bg-zinc-900 rounded-2xl p-6 mb-6 border border-zinc-800">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Address
          </h3>
          <p className="text-zinc-300">{formatAddress()}</p>
          <p className="text-xs text-zinc-500 mt-2">
            Update your address in the Personal Information section above
          </p>
        </div>

        {/* Security Section */}
        <div className="bg-zinc-900 rounded-2xl p-6 mb-6 border border-zinc-800">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Security
          </h3>
          <div className="space-y-4">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-between px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-zinc-400" />
                <div>
                  <p className="text-white font-medium">Change Password</p>
                  <p className="text-xs text-zinc-500">Update your account password</p>
                </div>
              </div>
              <Edit2 className="w-4 h-4 text-zinc-400" />
            </button>
            <a
              href="/forgot-password"
              className="block w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-zinc-400" />
                <div>
                  <p className="text-white font-medium">Reset Password</p>
                  <p className="text-xs text-zinc-500">Forgot your password? Reset it here</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Payment Methods Section */}
        <div className="mb-6">
          <PaymentMethods userId={user.id} />
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <QuickActions />
        </div>

        {/* Account Actions */}
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <h3 className="text-lg font-semibold text-white mb-4">Account Actions</h3>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
          >
            <Trash2 className="w-5 h-5" />
            Delete Account
          </button>
          <p className="text-xs text-zinc-500 mt-2">
            Permanently delete your account and all associated data
          </p>
        </div>

        {/* Email Change Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Change Email</h3>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <EmailChangeForm
                user={user}
                onUpdate={handleUpdate}
                onClose={() => setShowEmailModal(false)}
              />
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Change Password</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <PasswordChangeForm onClose={() => setShowPasswordModal(false)} />
            </div>
          </div>
        )}

        {/* Profile Image Upload Modal */}
        {showProfileImageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Image
                </h3>
                <button
                  onClick={() => setShowProfileImageModal(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ProfileImageUpload
                user={user}
                onUpdate={(updatedUser) => {
                  handleUpdate(updatedUser);
                  setShowProfileImageModal(false);
                }}
                onClose={() => setShowProfileImageModal(false)}
              />
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
          title="Delete Account"
          message="Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data, orders, and reviews."
          confirmText="Delete Account"
          cancelText="Cancel"
          type="danger"
          loading={deleting}
        />
      </div>
    </div>
  );
}

