"use client";

import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Lock, Eye, EyeOff } from "lucide-react";
import { profileService } from "@/services/profile.service";
import { useToast } from "@/contexts";

interface PasswordChangeFormProps {
  onClose: () => void;
}

const validationSchema = Yup.object({
  passwordCurrent: Yup.string().required("Current password is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("New password is required"),
  passwordConfirm: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
});

export default function PasswordChangeForm({ onClose }: PasswordChangeFormProps) {
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const { showToast } = useToast();

  const formik = useFormik({
    initialValues: {
      passwordCurrent: "",
      password: "",
      passwordConfirm: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await profileService.changePassword({
          passwordCurrent: values.passwordCurrent,
          password: values.password,
        });
        showToast("Password changed successfully", "success");
        formik.resetForm();
        onClose();
      } catch (error: unknown) {
        console.error("Failed to change password:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to change password";
        showToast(errorMessage, "error");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="passwordCurrent" className="block text-sm font-medium text-zinc-300 mb-2">
          Current Password *
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Lock className="h-5 w-5 text-zinc-400" />
          </div>
          <input
            id="passwordCurrent"
            type={showCurrentPassword ? "text" : "password"}
            className={`w-full pl-10 pr-10 py-2 rounded-lg border bg-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 ${
              formik.touched.passwordCurrent && formik.errors.passwordCurrent
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-zinc-700 focus:border-white focus:ring-white"
            }`}
            placeholder="Enter current password"
            {...formik.getFieldProps("passwordCurrent")}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-zinc-400 hover:text-white"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
          >
            {showCurrentPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {formik.touched.passwordCurrent && formik.errors.passwordCurrent && (
          <p className="mt-1 text-xs text-red-500">{formik.errors.passwordCurrent}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
          New Password *
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Lock className="h-5 w-5 text-zinc-400" />
          </div>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            className={`w-full pl-10 pr-10 py-2 rounded-lg border bg-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 ${
              formik.touched.password && formik.errors.password
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-zinc-700 focus:border-white focus:ring-white"
            }`}
            placeholder="Enter new password (min 8 characters)"
            {...formik.getFieldProps("password")}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-zinc-400 hover:text-white"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {formik.touched.password && formik.errors.password && (
          <p className="mt-1 text-xs text-red-500">{formik.errors.password}</p>
        )}
      </div>

      <div>
        <label htmlFor="passwordConfirm" className="block text-sm font-medium text-zinc-300 mb-2">
          Confirm New Password *
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Lock className="h-5 w-5 text-zinc-400" />
          </div>
          <input
            id="passwordConfirm"
            type={showPasswordConfirm ? "text" : "password"}
            className={`w-full pl-10 pr-10 py-2 rounded-lg border bg-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 ${
              formik.touched.passwordConfirm && formik.errors.passwordConfirm
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-zinc-700 focus:border-white focus:ring-white"
            }`}
            placeholder="Confirm new password"
            {...formik.getFieldProps("passwordConfirm")}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-zinc-400 hover:text-white"
            onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
          >
            {showPasswordConfirm ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {formik.touched.passwordConfirm && formik.errors.passwordConfirm && (
          <p className="mt-1 text-xs text-red-500">{formik.errors.passwordConfirm}</p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-zinc-800 text-white border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Changing..." : "Change Password"}
        </button>
      </div>
    </form>
  );
}

