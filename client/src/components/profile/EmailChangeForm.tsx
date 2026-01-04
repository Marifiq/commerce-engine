"use client";

import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { User } from "@/types/user";
import { profileService } from "@/services/profile.service";
import { useToast } from "@/contexts";

interface EmailChangeFormProps {
  user: User;
  onUpdate: (user: User) => void;
  onClose: () => void;
}

const validationSchema = Yup.object({
  email: Yup.string().email("Invalid email address").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export default function EmailChangeForm({
  user,
  onUpdate,
  onClose,
}: EmailChangeFormProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { showToast } = useToast();

  const formik = useFormik({
    initialValues: {
      email: user.email || "",
      password: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const response = await profileService.updateEmail({
          email: values.email,
          password: values.password,
        });
        onUpdate(response.data.user);
        showToast("Email updated successfully", "success");
        onClose();
      } catch (error: unknown) {
        console.error("Failed to update email:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to update email";
        showToast(errorMessage, "error");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
          New Email Address *
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Mail className="h-5 w-5 text-zinc-400" />
          </div>
          <input
            id="email"
            type="email"
            className={`w-full pl-10 pr-3 py-2 rounded-lg border bg-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 ${
              formik.touched.email && formik.errors.email
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-zinc-700 focus:border-white focus:ring-white"
            }`}
            placeholder="newemail@example.com"
            {...formik.getFieldProps("email")}
          />
        </div>
        {formik.touched.email && formik.errors.email && (
          <p className="mt-1 text-xs text-red-500">{formik.errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
          Current Password * (required to change email)
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
            placeholder="Enter your current password"
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
          {loading ? "Updating..." : "Update Email"}
        </button>
      </div>
    </form>
  );
}

