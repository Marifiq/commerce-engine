'use client';

import { useEffect, useState } from 'react';
import { X, CreditCard, Truck, CheckCircle, LogIn } from 'lucide-react';
import Image from 'next/image';
import { useSelector, useDispatch } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useRouter } from 'next/navigation';
import {
    selectIsCheckoutOpen,
    selectCartItems,
    selectCartTotal,
    toggleCheckout,
    clearCart,
    fetchCart
} from '../../redux/features/cartSlice';
import { CartItem } from '../../types';


import { orderService } from '../../services/orderService';
import { AppDispatch, RootState } from '../../redux/store';
import { resolveImageUrl } from '../../utils/imageUtils';

type OrderReceipt = {
    customer: any;
    items: any[];
    total: number;
    trackingId: string;
    date: string;
} | null;

export default function CheckoutModal() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const isCheckoutOpen = useSelector(selectIsCheckoutOpen);
    const items = useSelector(selectCartItems);
    const total = useSelector(selectCartTotal);
    const [orderReceipt, setOrderReceipt] = useState<OrderReceipt>(null);
    const [loading, setLoading] = useState(false);
    const [checkoutError, setCheckoutError] = useState('');
    const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);

    const handleToggleCheckout = () => dispatch(toggleCheckout());
    const handleClearCart = () => dispatch(clearCart());

    // Sync cart state with backend on mount
    useEffect(() => {
        if (isCheckoutOpen) {
            dispatch(fetchCart());
        }
    }, [isCheckoutOpen, dispatch]);

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
        onSubmit: async (values) => {
            if (!isAuthenticated) {
                setCheckoutError('Please sign in to confirm your order');
                return;
            }
            setLoading(true);
            setCheckoutError('');
            try {
                const orderData = {
                    shippingAddress: `${values.address}, ${values.city}, ${values.zip}`,
                    paymentMethod: values.paymentMethod,
                };

                const order = await orderService.createOrder(orderData);

                const receipt: OrderReceipt = {
                    customer: values,
                    items: [...items],
                    total: order.totalAmount || order.total || 0,
                    trackingId: `ORD-${order.id}`,
                    date: order.createdAt,
                };

                setOrderReceipt(receipt);
                handleClearCart();
                formik.resetForm();
            } catch (err: any) {
                setCheckoutError(err.message || 'Failed to place order');
            } finally {
                setLoading(false);
            }
        },
    });


    const handleClose = () => {
        handleToggleCheckout();
        // Delay resetting receipt so it doesn't flash back to form while closing
        setTimeout(() => setOrderReceipt(null), 300);
    };

    const handleContinueShopping = () => {
        handleToggleCheckout();
        // Delay resetting receipt so it doesn't flash back to form while closing
        setTimeout(() => {
            setOrderReceipt(null);
            router.push('/shop');
        }, 300);
    };

    if (!isCheckoutOpen) return null;

    if (orderReceipt) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 text-zinc-900 bg-black/60 backdrop-blur-md dark:text-zinc-100 font-sans animate-in fade-in duration-200">
                <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 p-8 sm:p-10 shadow-2xl text-center animate-in zoom-in-95 duration-200">
                    <button
                        onClick={handleClose}
                        className="absolute right-4 top-4 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all duration-200"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                            <CheckCircle className="h-20 w-20 text-green-500 dark:text-green-400 relative z-10" strokeWidth={2.5} />
                        </div>
                    </div>

                    <h2 className="text-3xl font-black mb-2 text-zinc-900 dark:text-white">Order Confirmed!</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-base">Your order is being processed and will be on the way soon.</p>

                    <div className="bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-800/50 dark:to-zinc-900/50 rounded-2xl p-6 mb-6 text-left border-2 border-zinc-200 dark:border-zinc-700">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 pb-6 border-b-2 border-zinc-200 dark:border-zinc-700">
                            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Tracking ID</span>
                            <span className="font-mono text-xl font-black tracking-widest text-black dark:text-white">{orderReceipt.trackingId}</span>
                        </div>

                        <div className="space-y-4 mb-6 max-h-48 overflow-y-auto pr-2">
                            {orderReceipt.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-3 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                                        {item.quantity}x <span className="font-semibold">{item.name}</span>
                                    </span>
                                    <span className="text-sm font-bold text-zinc-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center pt-6 border-t-2 border-zinc-200 dark:border-zinc-700">
                            <span className="text-lg font-black text-zinc-900 dark:text-white">Total</span>
                            <span className="text-2xl font-black text-zinc-900 dark:text-white">${(orderReceipt.total || 0).toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleContinueShopping}
                        className="w-full rounded-xl bg-black dark:bg-white px-6 py-4 text-base font-bold text-white dark:text-black shadow-lg hover:shadow-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 lg:p-6 text-zinc-900 bg-black/60 backdrop-blur-md dark:text-zinc-100 font-sans animate-in fade-in duration-200">
            <div className="relative w-full max-w-6xl max-h-[95vh] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 flex flex-col lg:flex-row animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={handleToggleCheckout}
                    className="absolute right-4 top-4 z-20 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all duration-200"
                    aria-label="Close checkout"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Left Column: Form */}
                <div className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto">
                    <div className="max-w-2xl mx-auto">
                        <h2 className="text-3xl sm:text-4xl font-black mb-2 text-zinc-900 dark:text-white">Checkout</h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">Complete your order details</p>

                        <form id="checkout-form" onSubmit={formik.handleSubmit} className="space-y-8">
                            {/* Contact Info */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-1 w-8 bg-black dark:bg-white rounded-full"></div>
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Contact Information</h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 ${formik.touched.firstName && formik.errors.firstName
                                                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                                    : 'border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10'
                                                }`}
                                            placeholder="John"
                                            {...formik.getFieldProps('firstName')}
                                        />
                                        {formik.touched.firstName && formik.errors.firstName && (
                                            <p className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1">
                                                {formik.errors.firstName}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 ${formik.touched.lastName && formik.errors.lastName
                                                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                                    : 'border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10'
                                                }`}
                                            placeholder="Doe"
                                            {...formik.getFieldProps('lastName')}
                                        />
                                        {formik.touched.lastName && formik.errors.lastName && (
                                            <p className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1">
                                                {formik.errors.lastName}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 ${formik.touched.email && formik.errors.email
                                                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                                : 'border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10'
                                            }`}
                                        placeholder="john.doe@example.com"
                                        {...formik.getFieldProps('email')}
                                    />
                                    {formik.touched.email && formik.errors.email && (
                                        <p className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1">
                                            {formik.errors.email}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-1 w-8 bg-black dark:bg-white rounded-full"></div>
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Shipping Address</h3>
                                </div>

                                <div>
                                    <label htmlFor="address" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                        Street Address
                                    </label>
                                    <input
                                        type="text"
                                        id="address"
                                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 ${formik.touched.address && formik.errors.address
                                                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                                : 'border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10'
                                            }`}
                                        placeholder="123 Main Street"
                                        {...formik.getFieldProps('address')}
                                    />
                                    {formik.touched.address && formik.errors.address && (
                                        <p className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1">
                                            {formik.errors.address}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label htmlFor="city" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            id="city"
                                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 ${formik.touched.city && formik.errors.city
                                                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                                    : 'border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10'
                                                }`}
                                            placeholder="New York"
                                            {...formik.getFieldProps('city')}
                                        />
                                        {formik.touched.city && formik.errors.city && (
                                            <p className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1">
                                                {formik.errors.city}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="zip" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                            ZIP / Postal Code
                                        </label>
                                        <input
                                            type="text"
                                            id="zip"
                                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 ${formik.touched.zip && formik.errors.zip
                                                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                                    : 'border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10'
                                                }`}
                                            placeholder="10001"
                                            {...formik.getFieldProps('zip')}
                                        />
                                        {formik.touched.zip && formik.errors.zip && (
                                            <p className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1">
                                                {formik.errors.zip}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-1 w-8 bg-black dark:bg-white rounded-full"></div>
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Payment Method</h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <label
                                        className={`group relative flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${formik.values.paymentMethod === 'card'
                                                ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-lg shadow-black/10 dark:shadow-white/10'
                                                : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-md'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="card"
                                            checked={formik.values.paymentMethod === 'card'}
                                            onChange={formik.handleChange}
                                            className="sr-only"
                                        />
                                        <CreditCard className={`h-6 w-6 flex-shrink-0 ${formik.values.paymentMethod === 'card' ? 'text-white dark:text-black' : 'text-zinc-600 dark:text-zinc-400'}`} />
                                        <span className="font-semibold text-base">Credit Card</span>
                                        {formik.values.paymentMethod === 'card' && (
                                            <div className="ml-auto h-5 w-5 rounded-full bg-white dark:bg-black flex items-center justify-center">
                                                <div className="h-2 w-2 rounded-full bg-black dark:bg-white"></div>
                                            </div>
                                        )}
                                    </label>

                                    <label
                                        className={`group relative flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${formik.values.paymentMethod === 'cod'
                                                ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-lg shadow-black/10 dark:shadow-white/10'
                                                : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-md'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="cod"
                                            checked={formik.values.paymentMethod === 'cod'}
                                            onChange={formik.handleChange}
                                            className="sr-only"
                                        />
                                        <Truck className={`h-6 w-6 flex-shrink-0 ${formik.values.paymentMethod === 'cod' ? 'text-white dark:text-black' : 'text-zinc-600 dark:text-zinc-400'}`} />
                                        <span className="font-semibold text-base">Cash on Delivery</span>
                                        {formik.values.paymentMethod === 'cod' && (
                                            <div className="ml-auto h-5 w-5 rounded-full bg-white dark:bg-black flex items-center justify-center">
                                                <div className="h-2 w-2 rounded-full bg-black dark:bg-white"></div>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column: Order Summary */}
                <div className="w-full lg:w-[420px] xl:w-[480px] bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-black border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 lg:p-10 flex flex-col">
                    <div className="mb-6">
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Order Summary</h3>
                        <div className="h-1 w-12 bg-black dark:bg-white rounded-full"></div>
                    </div>

                    {checkoutError && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800">
                            <p className="text-sm font-semibold text-red-600 dark:text-red-400 text-center">{checkoutError}</p>
                            {!isAuthenticated && checkoutError.includes('sign in') && (
                                <button
                                    onClick={() => {
                                        handleToggleCheckout();
                                        router.push('/login?redirect=checkout');
                                    }}
                                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-4 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer"
                                >
                                    <LogIn size={14} />
                                    Sign In Now
                                </button>
                            )}
                        </div>
                    )}

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6 min-h-0">
                        {items.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                                <p className="text-sm">Your cart is empty</p>
                            </div>
                        ) : (
                            items.map((item) => (
                                <div key={item.id} className="flex gap-4 p-4 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-shadow duration-200">
                                    <div className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800">
                                        <img
                                            src={resolveImageUrl(item.image)}
                                            alt={item.name}
                                            className="h-full w-full object-cover object-center"
                                        />
                                    </div>
                                    <div className="flex flex-1 flex-col justify-between min-w-0">
                                        <div>
                                            <h4 className="font-bold text-zinc-900 dark:text-white text-base mb-1 line-clamp-2">{item.name}</h4>
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="text-lg font-bold text-zinc-900 dark:text-white mt-2">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Price Breakdown */}
                    <div className="border-t-2 border-zinc-200 dark:border-zinc-700 pt-6 space-y-4 mb-6">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400 font-medium">Subtotal</span>
                            <span className="font-bold text-zinc-900 dark:text-white">${total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400 font-medium">Shipping</span>
                            <span className="font-bold text-green-600 dark:text-green-400">Free</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-zinc-200 dark:border-zinc-700">
                            <span className="text-lg font-black text-zinc-900 dark:text-white">Total</span>
                            <span className="text-2xl font-black text-zinc-900 dark:text-white">${total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        form="checkout-form"
                        disabled={loading || items.length === 0}
                        className={`w-full rounded-xl px-6 py-4 text-base font-bold text-white dark:text-black shadow-lg hover:shadow-xl transition-all duration-200 ${loading || items.length === 0
                                ? 'bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed opacity-60'
                                : 'bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Confirming Order...
                            </span>
                        ) : (
                            'Confirm Order'
                        )}
                    </button>

                    <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        🔒 Secure Checkout powered by VoiceAgent
                    </p>
                </div>
            </div>
        </div>
    );
}
