'use client';

import { useEffect, useState } from 'react';
import { X, CreditCard, Truck, CheckCircle, LogIn, ImageIcon, Phone, Wallet, Plus } from 'lucide-react';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/hooks/useRedux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    selectIsCheckoutOpen,
    selectCartItems,
    selectCartTotal,
    toggleCheckout,
    clearCart,
    fetchCart
} from '@/store/features/cart';
import { CartItem } from '@/types/cart';
import { orderService } from '@/services/order.service';
import { RootState } from '@/store/store';
import { resolveImageUrl } from '@/lib/utils/imageUtils';
import { profileService } from '@/services/profile.service';
import { paymentService } from '@/services/payment.service';
import { PaymentMethod } from '@/types/payment';
import AddPaymentMethodModal from '@/components/profile/AddPaymentMethodModal';
import { getAllowGuestCheckout } from '@/services/settings.service';

type OrderReceipt = {
    customer: any;
    items: any[];
    total: number;
    trackingId: string;
    date: string;
} | null;

const PENDING_CHECKOUT_DATA_KEY = 'pendingCheckoutData';

export default function CheckoutModal() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();
    const isCheckoutOpen = useSelector(selectIsCheckoutOpen);
    const items = useSelector(selectCartItems);
    const total = useSelector(selectCartTotal);
    const [orderReceipt, setOrderReceipt] = useState<OrderReceipt>(null);
    const [loading, setLoading] = useState(false);
    const [checkoutError, setCheckoutError] = useState('');
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null);
    const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
    const [allowGuestCheckout, setAllowGuestCheckout] = useState(false);
    const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
    const currentUser = useSelector((state: RootState) => state.user.currentUser);

    const handleToggleCheckout = () => dispatch(toggleCheckout());
    const handleClearCart = () => dispatch(clearCart());

    // Auto-open checkout modal if redirect=checkout is in URL and user is authenticated
    useEffect(() => {
        const redirectParam = searchParams.get('redirect');
        if (redirectParam === 'checkout' && isAuthenticated && !isCheckoutOpen) {
            dispatch(toggleCheckout());
        }
    }, [searchParams, isAuthenticated, isCheckoutOpen, dispatch]);

    // Fetch guest checkout setting on mount
    useEffect(() => {
        const fetchGuestCheckoutSetting = async () => {
            try {
                const allowed = await getAllowGuestCheckout();
                setAllowGuestCheckout(allowed);
            } catch (error) {
                console.error('Failed to fetch guest checkout setting:', error);
                setAllowGuestCheckout(false); // Default to false (require account)
            }
        };
        fetchGuestCheckoutSetting();
    }, []);

    // Sync cart state with backend on mount
    useEffect(() => {
        if (isCheckoutOpen) {
            dispatch(fetchCart());
            if (isAuthenticated) {
                fetchPaymentMethods();
            }
        }
    }, [isCheckoutOpen, dispatch, isAuthenticated]);

    const fetchPaymentMethods = async () => {
        try {
            const methods = await paymentService.getPaymentMethods();
            setPaymentMethods(methods);
            // Set default payment method if available
            const defaultMethod = methods.find(m => m.isDefault);
            if (defaultMethod) {
                setSelectedPaymentMethodId(defaultMethod.id);
                formik.setFieldValue('paymentMethod', defaultMethod.type);
            }
        } catch (error) {
            console.error('Failed to fetch payment methods:', error);
        }
    };

    const validationSchema = Yup.object({
        firstName: Yup.string().required('First Name is required'),
        lastName: Yup.string().required('Last Name is required'),
        email: Yup.string().email('Invalid email address').required('Email is required'),
        phoneNumber: Yup.string().required('Phone Number is required'),
        address: Yup.string().required('Address is required'),
        city: Yup.string().required('City is required'),
        zip: Yup.string().required('ZIP Code is required'),
        paymentMethod: Yup.string().required('Payment Method is required'),
        paymentMethodId: Yup.number().nullable(),
    });

    const formik = useFormik({
        initialValues: {
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
            address: '',
            city: '',
            zip: '',
            paymentMethod: 'visa',
            paymentMethodId: null as number | null,
        },
        validationSchema,
        onSubmit: async (values) => {
            if (!isAuthenticated) {
                // Check if guest checkout is allowed
                if (!allowGuestCheckout) {
                    // Save form data to localStorage
                    const formDataToSave = {
                        firstName: values.firstName,
                        lastName: values.lastName,
                        email: values.email,
                        phoneNumber: values.phoneNumber,
                        address: values.address,
                        city: values.city,
                        zip: values.zip,
                        paymentMethod: values.paymentMethod,
                        paymentMethodId: values.paymentMethodId,
                    };
                    localStorage.setItem(PENDING_CHECKOUT_DATA_KEY, JSON.stringify(formDataToSave));
                    
                    // Close checkout modal and redirect to login
                    handleToggleCheckout();
                    router.push('/login?redirect=checkout');
                    return;
                }
                // If guest checkout is allowed, continue with order processing below
            }
            setLoading(true);
            setCheckoutError('');
            try {
                // Get selected payment method details
                const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethodId);
                const paymentMethodLabel = selectedMethod 
                    ? (selectedMethod.type === 'visa' 
                        ? `${selectedMethod.brand?.toUpperCase() || 'Card'} •••• ${selectedMethod.last4 || ''}`
                        : selectedMethod.type === 'jazzcash'
                        ? `JazzCash • ${selectedMethod.phoneNumber || ''}`
                        : `EasyPaisa • ${selectedMethod.phoneNumber || ''}`)
                    : values.paymentMethod;

                let order;

                if (!isAuthenticated && allowGuestCheckout) {
                    // Guest checkout - send cart items from Redux state
                    const guestOrderData = {
                        items: items.map(item => ({
                            productId: item.productId, // Use productId from cart item
                            quantity: item.quantity,
                            size: item.size || undefined,
                            price: item.price,
                        })),
                        shippingAddress: `${values.address}, ${values.city}, ${values.zip}`,
                        paymentMethod: paymentMethodLabel,
                        phoneNumber: values.phoneNumber,
                        customerEmail: values.email,
                        customerName: `${values.firstName} ${values.lastName}`.trim(),
                    };

                    order = await orderService.createGuestOrder(guestOrderData);
                } else {
                    // Authenticated checkout
                    const orderData = {
                        shippingAddress: `${values.address}, ${values.city}, ${values.zip}`,
                        paymentMethod: paymentMethodLabel,
                        phoneNumber: values.phoneNumber,
                    };

                    order = await orderService.createOrder(orderData);
                }

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
                // Clear pending checkout data from localStorage after successful order
                localStorage.removeItem(PENDING_CHECKOUT_DATA_KEY);
            } catch (err: any) {
                setCheckoutError(err.message || 'Failed to place order');
            } finally {
                setLoading(false);
            }
        },
    });

    // Check for redirect parameter and restore form data from localStorage
    useEffect(() => {
        if (isCheckoutOpen && isAuthenticated) {
            const redirectParam = searchParams.get('redirect');
            if (redirectParam === 'checkout') {
                // Restore form data from localStorage
                const savedData = localStorage.getItem(PENDING_CHECKOUT_DATA_KEY);
                if (savedData) {
                    try {
                        const formData = JSON.parse(savedData);
                        formik.setValues({
                            ...formik.values,
                            ...formData,
                        });
                    } catch (error) {
                        console.error('Failed to restore checkout form data:', error);
                    }
                }
                // Clear redirect parameter from URL
                const currentPath = window.location.pathname;
                router.replace(currentPath, { scroll: false });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCheckoutOpen, isAuthenticated, searchParams, router]);

    // Auto-fill form with user profile data when checkout opens
    useEffect(() => {
        const fillFormWithProfile = async () => {
            if (!isCheckoutOpen || !isAuthenticated) return;

            // Check if we have pending checkout data - if so, don't overwrite it
            const savedData = localStorage.getItem(PENDING_CHECKOUT_DATA_KEY);
            if (savedData) return;

            try {
                // Fetch latest profile data from server
                const profileResponse = await profileService.getProfile();
                const user = profileResponse.data.user;

                if (user) {
                    // Split name into firstName and lastName
                    const nameParts = (user.name || '').trim().split(/\s+/);
                    const firstName = nameParts[0] || '';
                    const lastName = nameParts.slice(1).join(' ') || '';

                    // Update form values with user profile data
                    formik.setValues({
                        firstName: firstName,
                        lastName: lastName,
                        email: user.email || '',
                        phoneNumber: '', // Phone number not stored in profile, user needs to enter
                        address: user.addressStreet || '',
                        city: user.addressCity || '',
                        zip: user.addressZip || '',
                        paymentMethod: formik.values.paymentMethod, // Keep existing payment method
                        paymentMethodId: formik.values.paymentMethodId,
                    });
                }
            } catch (error) {
                // If profile fetch fails, try to use currentUser from Redux as fallback
                if (currentUser) {
                    const nameParts = (currentUser.name || '').trim().split(/\s+/);
                    const firstName = nameParts[0] || '';
                    const lastName = nameParts.slice(1).join(' ') || '';

                    formik.setValues({
                        firstName: firstName,
                        lastName: lastName,
                        email: currentUser.email || '',
                        phoneNumber: '', // Phone number not stored in profile, user needs to enter
                        address: currentUser.addressStreet || '',
                        city: currentUser.addressCity || '',
                        zip: currentUser.addressZip || '',
                        paymentMethod: formik.values.paymentMethod,
                        paymentMethodId: formik.values.paymentMethodId,
                    });
                }
                // Silently fail - user can still fill form manually
                console.error('Failed to fetch profile for auto-fill:', error);
            }
        };

        fillFormWithProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCheckoutOpen, isAuthenticated, currentUser?.id]);

    const handleClose = () => {
        handleToggleCheckout();
        // Clear pending checkout data when user manually closes checkout
        localStorage.removeItem(PENDING_CHECKOUT_DATA_KEY);
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
                <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <div className="w-full">
                        <h2 className="text-2xl sm:text-3xl font-black mb-1 text-zinc-900 dark:text-white">Checkout</h2>
                        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-4 sm:mb-6">Complete your order details</p>

                        <form id="checkout-form" onSubmit={formik.handleSubmit} className="space-y-4 sm:space-y-5">
                            {/* Contact Info */}
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                    <div className="h-1 w-6 sm:w-8 bg-black dark:bg-white rounded-full"></div>
                                    <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">Contact Information</h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label htmlFor="firstName" className="block text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border-2 transition-all duration-200 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm ${formik.touched.firstName && formik.errors.firstName
                                                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                                    : 'border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10'
                                                }`}
                                            placeholder="John"
                                            {...formik.getFieldProps('firstName')}
                                        />
                                        {formik.touched.firstName && formik.errors.firstName && (
                                            <p className="mt-1 text-xs font-medium text-red-500 flex items-center gap-1">
                                                {formik.errors.firstName}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="lastName" className="block text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border-2 transition-all duration-200 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm ${formik.touched.lastName && formik.errors.lastName
                                                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                                    : 'border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10'
                                                }`}
                                            placeholder="Doe"
                                            {...formik.getFieldProps('lastName')}
                                        />
                                        {formik.touched.lastName && formik.errors.lastName && (
                                            <p className="mt-1 text-xs font-medium text-red-500 flex items-center gap-1">
                                                {formik.errors.lastName}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border-2 transition-all duration-200 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm ${formik.touched.email && formik.errors.email
                                                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                                    : 'border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10'
                                                }`}
                                            placeholder="john.doe@example.com"
                                            {...formik.getFieldProps('email')}
                                        />
                                        {formik.touched.email && formik.errors.email && (
                                            <p className="mt-1 text-xs font-medium text-red-500 flex items-center gap-1">
                                                {formik.errors.email}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="phoneNumber" className="block text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            id="phoneNumber"
                                            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border-2 transition-all duration-200 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm ${formik.touched.phoneNumber && formik.errors.phoneNumber
                                                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                                    : 'border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10'
                                                }`}
                                            placeholder="+1 (555) 123-4567"
                                            {...formik.getFieldProps('phoneNumber')}
                                        />
                                        {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                                            <p className="mt-1 text-xs font-medium text-red-500 flex items-center gap-1">
                                                {formik.errors.phoneNumber}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                    <div className="h-1 w-6 sm:w-8 bg-black dark:bg-white rounded-full"></div>
                                    <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">Shipping Address</h3>
                                </div>

                                <div>
                                    <label htmlFor="address" className="block text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                        Street Address
                                    </label>
                                    <input
                                        type="text"
                                        id="address"
                                        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border-2 transition-all duration-200 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm ${formik.touched.address && formik.errors.address
                                                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                                : 'border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10'
                                            }`}
                                        placeholder="123 Main Street"
                                        {...formik.getFieldProps('address')}
                                    />
                                    {formik.touched.address && formik.errors.address && (
                                        <p className="mt-1 text-xs font-medium text-red-500 flex items-center gap-1">
                                            {formik.errors.address}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label htmlFor="city" className="block text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            id="city"
                                            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border-2 transition-all duration-200 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm ${formik.touched.city && formik.errors.city
                                                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                                    : 'border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10'
                                                }`}
                                            placeholder="New York"
                                            {...formik.getFieldProps('city')}
                                        />
                                        {formik.touched.city && formik.errors.city && (
                                            <p className="mt-1 text-xs font-medium text-red-500 flex items-center gap-1">
                                                {formik.errors.city}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="zip" className="block text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                            ZIP / Postal Code
                                        </label>
                                        <input
                                            type="text"
                                            id="zip"
                                            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border-2 transition-all duration-200 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm ${formik.touched.zip && formik.errors.zip
                                                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                                    : 'border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10'
                                                }`}
                                            placeholder="10001"
                                            {...formik.getFieldProps('zip')}
                                        />
                                        {formik.touched.zip && formik.errors.zip && (
                                            <p className="mt-1 text-xs font-medium text-red-500 flex items-center gap-1">
                                                {formik.errors.zip}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                    <div className="h-1 w-6 sm:w-8 bg-black dark:bg-white rounded-full"></div>
                                    <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">Payment Method</h3>
                                </div>

                                {isAuthenticated && paymentMethods.length > 0 ? (
                                    <div className="space-y-2 sm:space-y-3">
                                        {paymentMethods.map((method) => {
                                            const isSelected = selectedPaymentMethodId === method.id;
                                            const getIcon = () => {
                                                if (method.type === 'visa') return <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />;
                                                if (method.type === 'jazzcash') return <Phone className="h-4 w-4 sm:h-5 sm:w-5" />;
                                                if (method.type === 'easypaisa') return <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />;
                                                return <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />;
                                            };
                                            const getLabel = () => {
                                                if (method.type === 'visa') {
                                                    return `${method.brand?.toUpperCase() || 'Card'} •••• ${method.last4 || ''}`;
                                                } else if (method.type === 'jazzcash') {
                                                    return `JazzCash • ${method.phoneNumber || ''}`;
                                                } else if (method.type === 'easypaisa') {
                                                    return `EasyPaisa • ${method.phoneNumber || ''}`;
                                                }
                                                return 'Payment Method';
                                            };

                                            return (
                                                <label
                                                    key={method.id}
                                                    className={`group relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                                        isSelected
                                                            ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-lg'
                                                            : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="paymentMethod"
                                                        value={method.type}
                                                        checked={isSelected}
                                                        onChange={() => {
                                                            setSelectedPaymentMethodId(method.id);
                                                            formik.setFieldValue('paymentMethod', method.type);
                                                            formik.setFieldValue('paymentMethodId', method.id);
                                                        }}
                                                        className="sr-only"
                                                    />
                                                    <div className={isSelected ? 'text-white dark:text-black' : 'text-zinc-600 dark:text-zinc-400'}>
                                                        {getIcon()}
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="font-semibold text-xs sm:text-sm block">{getLabel()}</span>
                                                        {method.isDefault && (
                                                            <span className="text-xs text-zinc-500 dark:text-zinc-400">Default</span>
                                                        )}
                                                    </div>
                                                    {isSelected && (
                                                        <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-white dark:bg-black flex items-center justify-center">
                                                            <div className="h-2 w-2 rounded-full bg-black dark:bg-white"></div>
                                                        </div>
                                                    )}
                                                </label>
                                            );
                                        })}
                                        <button
                                            type="button"
                                            onClick={() => setShowAddPaymentModal(true)}
                                            className="w-full flex items-center justify-center gap-2 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors text-zinc-600 dark:text-zinc-400 text-sm"
                                        >
                                            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="font-medium text-xs sm:text-sm">Add New Payment Method</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                        <label
                                            className={`group relative flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                                                formik.values.paymentMethod === 'visa'
                                                    ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-lg'
                                                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="visa"
                                                checked={formik.values.paymentMethod === 'visa'}
                                                onChange={formik.handleChange}
                                                className="sr-only"
                                            />
                                            <CreditCard className={`h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 ${formik.values.paymentMethod === 'visa' ? 'text-white dark:text-black' : 'text-zinc-600 dark:text-zinc-400'}`} />
                                            <span className="font-semibold text-sm sm:text-base">Visa Card</span>
                                            {formik.values.paymentMethod === 'visa' && (
                                                <div className="ml-auto h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-white dark:bg-black flex items-center justify-center">
                                                    <div className="h-2 w-2 rounded-full bg-black dark:bg-white"></div>
                                                </div>
                                            )}
                                        </label>

                                        <label
                                            className={`group relative flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                                                formik.values.paymentMethod === 'jazzcash'
                                                    ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-lg'
                                                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="jazzcash"
                                                checked={formik.values.paymentMethod === 'jazzcash'}
                                                onChange={formik.handleChange}
                                                className="sr-only"
                                            />
                                            <Phone className={`h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 ${formik.values.paymentMethod === 'jazzcash' ? 'text-white dark:text-black' : 'text-zinc-600 dark:text-zinc-400'}`} />
                                            <span className="font-semibold text-sm sm:text-base">JazzCash</span>
                                            {formik.values.paymentMethod === 'jazzcash' && (
                                                <div className="ml-auto h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-white dark:bg-black flex items-center justify-center">
                                                    <div className="h-2 w-2 rounded-full bg-black dark:bg-white"></div>
                                                </div>
                                            )}
                                        </label>

                                        <label
                                            className={`group relative flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                                                formik.values.paymentMethod === 'easypaisa'
                                                    ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-lg'
                                                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="easypaisa"
                                                checked={formik.values.paymentMethod === 'easypaisa'}
                                                onChange={formik.handleChange}
                                                className="sr-only"
                                            />
                                            <Wallet className={`h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 ${formik.values.paymentMethod === 'easypaisa' ? 'text-white dark:text-black' : 'text-zinc-600 dark:text-zinc-400'}`} />
                                            <span className="font-semibold text-sm sm:text-base">EasyPaisa</span>
                                            {formik.values.paymentMethod === 'easypaisa' && (
                                                <div className="ml-auto h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-white dark:bg-black flex items-center justify-center">
                                                    <div className="h-2 w-2 rounded-full bg-black dark:bg-white"></div>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column: Order Summary */}
                <div className="w-full lg:w-[420px] xl:w-[480px] bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-black border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 lg:p-8 flex flex-col">
                    <div className="mb-4 sm:mb-6">
                        <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mb-1 sm:mb-2">Order Summary</h3>
                        <div className="h-1 w-10 sm:w-12 bg-black dark:bg-white rounded-full"></div>
                    </div>

                    {checkoutError && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800">
                            <p className="text-sm font-semibold text-red-600 dark:text-red-400 text-center">{checkoutError}</p>
                        </div>
                    )}

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 sm:space-y-4 mb-4 sm:mb-6 min-h-0">
                        {items.length === 0 ? (
                            <div className="text-center py-6 sm:py-8 text-zinc-500 dark:text-zinc-400">
                                <p className="text-xs sm:text-sm">Your cart is empty</p>
                            </div>
                        ) : (
                            items.map((item) => (
                                <div key={item.id} className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-shadow duration-200">
                                    <div className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded-lg sm:rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center relative">
                                        {item.image && resolveImageUrl(item.image) ? (
                                            <img
                                                src={resolveImageUrl(item.image)}
                                                alt={item.name}
                                                className="h-full w-full object-cover object-center"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    const parent = (e.target as HTMLImageElement).parentElement;
                                                    if (parent) {
                                                        const icon = parent.querySelector('.checkout-image-icon') as HTMLElement;
                                                        if (icon) icon.style.display = 'flex';
                                                    }
                                                }}
                                            />
                                        ) : null}
                                        <div className="checkout-image-icon absolute inset-0 flex items-center justify-center" style={{ display: (!item.image || !resolveImageUrl(item.image)) ? 'flex' : 'none' }}>
                                            <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-400 dark:text-zinc-500" />
                                        </div>
                                    </div>
                                    <div className="flex flex-1 flex-col justify-between min-w-0">
                                        <div>
                                            <h4 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base mb-1 line-clamp-2">{item.name}</h4>
                                            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mt-1 sm:mt-2">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Price Breakdown */}
                    <div className="border-t-2 border-zinc-200 dark:border-zinc-700 pt-4 sm:pt-6 space-y-3 sm:space-y-4 mb-4 sm:mb-6">
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
                        className={`w-full rounded-lg sm:rounded-xl px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-bold text-white dark:text-black shadow-lg hover:shadow-xl transition-all duration-200 ${loading || items.length === 0
                                ? 'bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed opacity-60'
                                : 'bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Confirming Order...
                            </span>
                        ) : (
                            'Confirm Order'
                        )}
                    </button>

                    <p className="mt-3 sm:mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        🔒 Secure Checkout powered by VoiceAgent
                    </p>
                </div>
            </div>

            {showAddPaymentModal && (
                <AddPaymentMethodModal
                    onClose={() => {
                        setShowAddPaymentModal(false);
                        fetchPaymentMethods();
                    }}
                    onSuccess={() => {
                        setShowAddPaymentModal(false);
                        fetchPaymentMethods();
                    }}
                />
            )}
        </div>
    );
}
