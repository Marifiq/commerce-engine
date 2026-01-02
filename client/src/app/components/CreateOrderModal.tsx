'use client';

import React, { useState } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import LoadingSpinner from './ui/LoadingSpinner';

interface CreateOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: { shippingAddress: string; paymentMethod: string; notes: string }) => Promise<void>;
    cartTotal: number;
    itemCount: number;
}

const validationSchema = Yup.object({
    shippingAddress: Yup.string()
        .required('Shipping address is required')
        .min(10, 'Please enter a complete address'),
    paymentMethod: Yup.string()
        .required('Payment method is required'),
    notes: Yup.string()
});

export function CreateOrderModal({ isOpen, onClose, onCreate, cartTotal, itemCount }: CreateOrderModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl relative overflow-hidden animate-in zoom-in fade-in duration-200 border border-zinc-200 dark:border-zinc-800">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">
                        Create Order
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
                        <X size={24} />
                    </button>
                </div>

                <Formik
                    initialValues={{
                        shippingAddress: '',
                        paymentMethod: 'card',
                        notes: ''
                    }}
                    validationSchema={validationSchema}
                    onSubmit={async (values, { setSubmitting }) => {
                        try {
                            await onCreate(values);
                            onClose();
                        } catch (error) {
                            console.error('Failed to create order:', error);
                        } finally {
                            setSubmitting(false);
                        }
                    }}
                >
                    {({ isSubmitting }) => (
                        <Form className="p-6 space-y-4">
                            {/* Order Summary */}
                            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Items</span>
                                    <span className="font-bold text-zinc-900 dark:text-white">{itemCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">Total</span>
                                    <span className="text-2xl font-black text-zinc-900 dark:text-white">${cartTotal}</span>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                    Shipping Address
                                </label>
                                <Field
                                    as="textarea"
                                    name="shippingAddress"
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none resize-none"
                                    placeholder="Enter complete shipping address..."
                                />
                                <ErrorMessage
                                    name="shippingAddress"
                                    component="div"
                                    className="mt-1 text-xs text-red-500 font-medium"
                                />
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                    Payment Method
                                </label>
                                <Field
                                    as="select"
                                    name="paymentMethod"
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none cursor-pointer"
                                >
                                    <option value="card">Credit/Debit Card</option>
                                    <option value="paypal">PayPal</option>
                                    <option value="cash">Cash on Delivery</option>
                                </Field>
                                <ErrorMessage
                                    name="paymentMethod"
                                    component="div"
                                    className="mt-1 text-xs text-red-500 font-medium"
                                />
                            </div>

                            {/* Order Notes */}
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                    Order Notes (Optional)
                                </label>
                                <Field
                                    as="textarea"
                                    name="notes"
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none resize-none"
                                    placeholder="e.g., Phone order, customer request..."
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 text-zinc-500 font-black uppercase tracking-widest text-[10px] hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-3 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-black/5 cursor-pointer hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting && <LoadingSpinner size="small" />}
                                    <ShoppingBag size={14} />
                                    Create Order
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}
