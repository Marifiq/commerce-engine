'use client';

import { useState } from 'react';
import { X, CreditCard, Truck, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { useSelector, useDispatch } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
    selectIsCheckoutOpen,
    selectCartItems,
    selectCartTotal,
    toggleCheckout,
    clearCart
} from '../../redux/features/cartSlice';
import { CartItem } from '../../redux/features/cartSlice';

type OrderReceipt = {
    customer: any;
    items: CartItem[];
    total: number;
    trackingId: string;
    date: string;
} | null;

export default function CheckoutModal() {
    const dispatch = useDispatch();
    const isCheckoutOpen = useSelector(selectIsCheckoutOpen);
    const items = useSelector(selectCartItems);
    const total = useSelector(selectCartTotal);
    const [orderReceipt, setOrderReceipt] = useState<OrderReceipt>(null);

    const handleToggleCheckout = () => dispatch(toggleCheckout());
    const handleClearCart = () => dispatch(clearCart());

    const generateTrackingId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 3; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const validationSchema = Yup.object({
        firstName: Yup.string().required('First Name is required'),
        lastName: Yup.string().required('Last Name is required'),
        email: Yup.string().email('Invalid email address').required('Email is required'),
        address: Yup.string().required('Address is required'),
        city: Yup.string().required('City is required'),
        zip: Yup.string().required('ZIP Code is required'),
        paymentMethod: Yup.string().required('Payment Method is required'),
    });

    const formik = useFormik({
        initialValues: {
            firstName: '',
            lastName: '',
            email: '',
            address: '',
            city: '',
            zip: '',
            paymentMethod: 'card',
        },
        validationSchema,
        onSubmit: (values) => {
            const trackingId = generateTrackingId();
            const receipt = {
                customer: values,
                items: [...items], // Capture current items
                total: total,
                trackingId: trackingId,
                date: new Date().toISOString(),
            };

            console.log('Order Placed:', receipt);
            setOrderReceipt(receipt);
            handleClearCart();
            formik.resetForm();
        },
    });

    const handleClose = () => {
        handleToggleCheckout();
        // Delay resetting receipt so it doesn't flash back to form while closing
        setTimeout(() => setOrderReceipt(null), 300);
    };

    if (!isCheckoutOpen) return null;

    if (orderReceipt) {
        return (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 text-zinc-900 bg-black/50 backdrop-blur-sm dark:text-zinc-100 font-sans">
                <div className="relative w-full max-w-lg rounded-xl bg-white p-8 shadow-2xl dark:bg-zinc-900 text-center">
                    <button
                        onClick={handleClose}
                        className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-black dark:hover:text-white"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    <div className="flex justify-center mb-6">
                        <CheckCircle className="h-16 w-16 text-green-500" />
                    </div>

                    <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-6">It's on the way.</p>

                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-6 mb-6 text-left">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-200 dark:border-zinc-700">
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">Tracking ID</span>
                            <span className="font-mono text-xl font-bold tracking-widest">{orderReceipt.trackingId}</span>
                        </div>

                        <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                            {orderReceipt.items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span>{item.quantity}x {item.name}</span>
                                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between font-bold pt-4 border-t border-zinc-200 dark:border-zinc-700">
                            <span>Total</span>
                            <span>${orderReceipt.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleClose}
                        className="w-full rounded-md bg-black px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-zinc-800 cursor-pointer dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 text-zinc-900 bg-black/50 backdrop-blur-sm dark:text-zinc-100 font-sans">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-zinc-900 flex flex-col md:flex-row">
                {/* Close Button */}
                <button
                    onClick={handleToggleCheckout}
                    className="absolute right-4 top-4 z-10 p-2 text-zinc-400 hover:text-black dark:hover:text-white"
                >
                    <X className="h-6 w-6" />
                </button>

                {/* Left Column: Form */}
                <div className="flex-1 p-6 sm:p-10 border-r border-zinc-100 dark:border-zinc-800">
                    <h2 className="text-2xl font-bold mb-6">Checkout</h2>
                    <form id="checkout-form" onSubmit={formik.handleSubmit} className="space-y-6">
                        {/* Contact Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Contact Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">First Name</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        id="firstName"
                                        className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${formik.touched.firstName && formik.errors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-300 focus:border-black focus:ring-black dark:bg-zinc-800 dark:border-zinc-700 dark:text-white'}`}
                                        {...formik.getFieldProps('firstName')}
                                    />
                                    {formik.touched.firstName && formik.errors.firstName && (
                                        <p className="mt-1 text-xs text-red-500">{formik.errors.firstName}</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Last Name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        id="lastName"
                                        className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${formik.touched.lastName && formik.errors.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-300 focus:border-black focus:ring-black dark:bg-zinc-800 dark:border-zinc-700 dark:text-white'}`}
                                        {...formik.getFieldProps('lastName')}
                                    />
                                    {formik.touched.lastName && formik.errors.lastName && (
                                        <p className="mt-1 text-xs text-red-500">{formik.errors.lastName}</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${formik.touched.email && formik.errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-300 focus:border-black focus:ring-black dark:bg-zinc-800 dark:border-zinc-700 dark:text-white'}`}
                                    {...formik.getFieldProps('email')}
                                />
                                {formik.touched.email && formik.errors.email && (
                                    <p className="mt-1 text-xs text-red-500">{formik.errors.email}</p>
                                )}
                            </div>
                        </div>

                        {/* Shipping */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Shipping Address</h3>
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    id="address"
                                    className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${formik.touched.address && formik.errors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-300 focus:border-black focus:ring-black dark:bg-zinc-800 dark:border-zinc-700 dark:text-white'}`}
                                    {...formik.getFieldProps('address')}
                                />
                                {formik.touched.address && formik.errors.address && (
                                    <p className="mt-1 text-xs text-red-500">{formik.errors.address}</p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        id="city"
                                        className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${formik.touched.city && formik.errors.city ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-300 focus:border-black focus:ring-black dark:bg-zinc-800 dark:border-zinc-700 dark:text-white'}`}
                                        {...formik.getFieldProps('city')}
                                    />
                                    {formik.touched.city && formik.errors.city && (
                                        <p className="mt-1 text-xs text-red-500">{formik.errors.city}</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="zip" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">ZIP / UI Code</label>
                                    <input
                                        type="text"
                                        name="zip"
                                        id="zip"
                                        className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${formik.touched.zip && formik.errors.zip ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-300 focus:border-black focus:ring-black dark:bg-zinc-800 dark:border-zinc-700 dark:text-white'}`}
                                        {...formik.getFieldProps('zip')}
                                    />
                                    {formik.touched.zip && formik.errors.zip && (
                                        <p className="mt-1 text-xs text-red-500">{formik.errors.zip}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Payment Method</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${formik.values.paymentMethod === 'card' ? 'border-black bg-zinc-50 dark:bg-zinc-800 dark:border-white' : 'border-zinc-200 dark:border-zinc-700'}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="card"
                                        checked={formik.values.paymentMethod === 'card'}
                                        onChange={formik.handleChange}
                                        className="h-4 w-4 text-black focus:ring-black"
                                    />
                                    <CreditCard className="h-5 w-5" />
                                    <span className="font-medium">Credit Card</span>
                                </label>
                                <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${formik.values.paymentMethod === 'cod' ? 'border-black bg-zinc-50 dark:bg-zinc-800 dark:border-white' : 'border-zinc-200 dark:border-zinc-700'}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="cod"
                                        checked={formik.values.paymentMethod === 'cod'}
                                        onChange={formik.handleChange}
                                        className="h-4 w-4 text-black focus:ring-black"
                                    />
                                    <Truck className="h-5 w-5" />
                                    <span className="font-medium">Cash on Delivery</span>
                                </label>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Right Column: Order Summary */}
                <div className="w-full md:w-96 bg-zinc-50 dark:bg-black/50 p-6 sm:p-10 flex flex-col h-full md:min-h-full">
                    <h3 className="text-lg font-medium mb-6">Order Summary</h3>
                    <div className="flex-1 overflow-y-auto max-h-60 md:max-h-[calc(100vh-400px)] pr-2 space-y-4 mb-6">
                        {items.map((item) => (
                            <div key={item.id} className="flex gap-4">
                                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        width={64}
                                        height={64}
                                        className="h-full w-full object-cover object-center"
                                    />
                                </div>
                                <div className="flex flex-1 flex-col">
                                    <span className="font-medium">{item.name}</span>
                                    <span className="text-sm text-zinc-500 dark:text-zinc-400">Qty: {item.quantity}</span>
                                </div>
                                <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6 space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500 dark:text-zinc-400">Subtotal</span>
                            <span className="font-medium">${total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500 dark:text-zinc-400">Shipping</span>
                            <span className="font-medium">Free</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-lg pt-4">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        form="checkout-form"
                        className="mt-8 w-full rounded-md bg-black px-6 py-4 text-base font-medium text-white shadow-sm hover:bg-zinc-800 cursor-pointer dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors"
                    >
                        Confirm Order
                    </button>
                    <p className="mt-4 text-center text-xs text-zinc-500">
                        Secure Checkout powered by VoiceAgent
                    </p>
                </div>
            </div>
        </div>
    );
}
