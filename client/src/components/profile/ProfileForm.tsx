"use client";

import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { User } from "@/types/user";
import { profileService, UpdateProfileData } from "@/services/profile.service";
import { useToast } from "@/contexts";

interface ProfileFormProps {
  user: User;
  onUpdate: (user: User) => void;
}

const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  gender: Yup.string().oneOf(
    ["male", "female", "other", "prefer-not-to-say", ""],
    "Invalid gender selection"
  ),
  phoneNumber: Yup.string().matches(
    /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
    "Please enter a valid phone number"
  ),
  addressStreet: Yup.string(),
  addressCity: Yup.string(),
  addressState: Yup.string(),
  addressZip: Yup.string(),
  addressCountry: Yup.string(),
});

export default function ProfileForm({ user, onUpdate }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const formik = useFormik({
    initialValues: {
      name: user.name || "",
      gender: user.gender || "",
      phoneNumber: user.phoneNumber || "",
      addressStreet: user.addressStreet || "",
      addressCity: user.addressCity || "",
      addressState: user.addressState || "",
      addressZip: user.addressZip || "",
      addressCountry: user.addressCountry || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const updateData: UpdateProfileData = {
          name: values.name,
          gender: values.gender || undefined,
          phoneNumber: values.phoneNumber || undefined,
          addressStreet: values.addressStreet || undefined,
          addressCity: values.addressCity || undefined,
          addressState: values.addressState || undefined,
          addressZip: values.addressZip || undefined,
          addressCountry: values.addressCountry || undefined,
        };

        const response = await profileService.updateProfile(updateData);
        onUpdate(response.data.user);
        showToast("Profile updated successfully", "success");
      } catch (error: unknown) {
        console.error("Failed to update profile:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to update profile";
        showToast(errorMessage, "error");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-zinc-300 mb-2"
        >
          Full Name *
        </label>
        <input
          id="name"
          type="text"
          className={`w-full px-4 py-2 rounded-lg border bg-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 ${
            formik.touched.name && formik.errors.name
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-zinc-700 focus:border-white focus:ring-white"
          }`}
          {...formik.getFieldProps("name")}
        />
        {formik.touched.name && formik.errors.name && (
          <p className="mt-1 text-xs text-red-500">{formik.errors.name}</p>
        )}
      </div>

      {/* Gender */}
      <div>
        <label
          htmlFor="gender"
          className="block text-sm font-medium text-zinc-300 mb-2"
        >
          Gender
        </label>
        <select
          id="gender"
          className="w-full px-4 py-2 rounded-lg border bg-zinc-800 text-white border-zinc-700 focus:outline-none focus:ring-1 focus:border-white focus:ring-white"
          {...formik.getFieldProps("gender")}
        >
          <option value="">Prefer not to say</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
        </select>
      </div>

      {/* Phone Number */}
      <div>
        <label
          htmlFor="phoneNumber"
          className="block text-sm font-medium text-zinc-300 mb-2"
        >
          Phone Number
        </label>
        <input
          id="phoneNumber"
          type="tel"
          className={`w-full px-4 py-2 rounded-lg border bg-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 ${
            formik.touched.phoneNumber && formik.errors.phoneNumber
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-zinc-700 focus:border-white focus:ring-white"
          }`}
          placeholder="+1 (555) 123-4567"
          {...formik.getFieldProps("phoneNumber")}
        />
        {formik.touched.phoneNumber && formik.errors.phoneNumber && (
          <p className="mt-1 text-xs text-red-500">{formik.errors.phoneNumber}</p>
        )}
      </div>

      {/* Address Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Address</h3>

        {/* Street */}
        <div>
          <label
            htmlFor="addressStreet"
            className="block text-sm font-medium text-zinc-300 mb-2"
          >
            Street Address
          </label>
          <input
            id="addressStreet"
            type="text"
            className="w-full px-4 py-2 rounded-lg border bg-zinc-800 text-white placeholder-zinc-500 border-zinc-700 focus:outline-none focus:ring-1 focus:border-white focus:ring-white"
            placeholder="123 Main St"
            {...formik.getFieldProps("addressStreet")}
          />
        </div>

        {/* City and State */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="addressCity"
              className="block text-sm font-medium text-zinc-300 mb-2"
            >
              City
            </label>
            <input
              id="addressCity"
              type="text"
              className="w-full px-4 py-2 rounded-lg border bg-zinc-800 text-white placeholder-zinc-500 border-zinc-700 focus:outline-none focus:ring-1 focus:border-white focus:ring-white"
              placeholder="City"
              {...formik.getFieldProps("addressCity")}
            />
          </div>
          <div>
            <label
              htmlFor="addressState"
              className="block text-sm font-medium text-zinc-300 mb-2"
            >
              State/Province
            </label>
            <input
              id="addressState"
              type="text"
              className="w-full px-4 py-2 rounded-lg border bg-zinc-800 text-white placeholder-zinc-500 border-zinc-700 focus:outline-none focus:ring-1 focus:border-white focus:ring-white"
              placeholder="State"
              {...formik.getFieldProps("addressState")}
            />
          </div>
        </div>

        {/* ZIP and Country */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="addressZip"
              className="block text-sm font-medium text-zinc-300 mb-2"
            >
              ZIP/Postal Code
            </label>
            <input
              id="addressZip"
              type="text"
              className="w-full px-4 py-2 rounded-lg border bg-zinc-800 text-white placeholder-zinc-500 border-zinc-700 focus:outline-none focus:ring-1 focus:border-white focus:ring-white"
              placeholder="12345"
              {...formik.getFieldProps("addressZip")}
            />
          </div>
          <div>
            <label
              htmlFor="addressCountry"
              className="block text-sm font-medium text-zinc-300 mb-2"
            >
              Country
            </label>
            <input
              id="addressCountry"
              type="text"
              className="w-full px-4 py-2 rounded-lg border bg-zinc-800 text-white placeholder-zinc-500 border-zinc-700 focus:outline-none focus:ring-1 focus:border-white focus:ring-white"
              placeholder="Country"
              {...formik.getFieldProps("addressCountry")}
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-white text-black rounded-lg hover:bg-zinc-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
