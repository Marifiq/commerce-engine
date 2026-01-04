'use client';

import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '@/lib/utils/api';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}
import {
    DollarSign,
    ShoppingBag,
    Users,
    TrendingUp,
    Clock,
    ChevronRight,
    Package,
    BarChart3,
    PieChart,
    Activity,
    ArrowUp,
    ArrowDown,
    LayoutDashboard,
    List,
    LineChart
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import CustomChartCard from '@/components/admin/CustomChartCard';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface DashboardStats {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalUsers: number;
    recentRevenue: number;
    weekRevenue: number;
    averageOrderValue: number;
    pendingOrders: number;
    completedOrders: number;
    ordersByStatus: Record<string, number>;
    monthlyRevenue: Record<string, number>;
    dailyRevenue: Record<string, number>;
    dailyOrders: Record<string, number>;
    monthlyUsers: Record<string, number>;
    productsByCategory: Record<string, number>;
    revenueByCategory: Record<string, number>;
    ordersByCategory: Record<string, number>;
    topProducts: Array<{ id: number; name: string; revenue: number; quantity: number }>;
    abandonedCarts: number;
    ordersByUserType: Record<string, { signedUp: number; guest: number }>;
    dailyNewsletterSubscribers: Record<string, number>;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStats, setSelectedStats] = useState<string[]>([]);
    const [settingsVersion, setSettingsVersion] = useState(0);
    const [customCharts, setCustomCharts] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'stats' | 'charts' | 'recent'>('stats');
    
    // Refs for GSAP animations
    const statCardsRef = useRef<HTMLDivElement>(null);
    const chartsRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);
    const tabContentRef = useRef<HTMLDivElement>(null);
    const hasAnimatedRef = useRef<string>('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, ordersRes, usersRes, settingsRes, chartsRes] = await Promise.all([
                    apiFetch('/admin/stats'),
                    apiFetch('/admin/orders'),
                    apiFetch('/admin/users'),
                    apiFetch('/admin/settings'),
                    apiFetch('/admin/custom-charts').catch(() => ({ data: { charts: [] } }))
                ]);

                setStats(statsRes.data);
                setRecentOrders(ordersRes.data.orders.slice(0, 5));
                setRecentUsers(usersRes.data.users.slice(0, 5));
                
                // Load dashboard stats configuration
                const settings = settingsRes.data.settings || {};
                const defaultStats = ['totalRevenue', 'totalOrders', 'totalProducts', 'totalUsers', 'averageOrderValue', 'pendingOrders', 'weekRevenue', 'abandonedCarts'];
                
                if (settings.dashboardStats) {
                    try {
                        const statsConfig = JSON.parse(settings.dashboardStats);
                        const parsedStats = Array.isArray(statsConfig) ? statsConfig : [];
                        // Ensure abandonedCarts is always included
                        if (!parsedStats.includes('abandonedCarts')) {
                            parsedStats.push('abandonedCarts');
                        }
                        setSelectedStats(parsedStats.length > 0 ? parsedStats : defaultStats);
                    } catch {
                        // Default: show all stats
                        setSelectedStats(defaultStats);
                    }
                } else {
                    // Default: show all stats
                    setSelectedStats(defaultStats);
                }

                // Load custom charts
                setCustomCharts(chartsRes.data.charts || []);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Real-time settings sync with polling and event listener
    useEffect(() => {
        const pollSettings = async () => {
            try {
                const settingsRes = await apiFetch('/admin/settings');
                const settings = settingsRes.data.settings || {};
                
                if (settings.dashboardStats) {
                    try {
                        const statsConfig = JSON.parse(settings.dashboardStats);
                        const newStats = Array.isArray(statsConfig) ? statsConfig : [];
                        // Ensure abandonedCarts is always included
                        if (!newStats.includes('abandonedCarts')) {
                            newStats.push('abandonedCarts');
                        }
                        
                        // Only update if stats changed
                        if (JSON.stringify(newStats) !== JSON.stringify(selectedStats)) {
                            setSelectedStats(newStats);
                            setSettingsVersion(prev => prev + 1);
                        }
                    } catch {
                        // Ignore parse errors
                    }
                }
            } catch (error) {
                // Silently fail - don't spam console
            }
        };

        // Listen for custom event from settings page
        const handleSettingsUpdate = () => {
            pollSettings();
        };

        window.addEventListener('dashboardSettingsUpdated', handleSettingsUpdate);

        // Poll every 5 seconds
        const interval = setInterval(pollSettings, 5000);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('dashboardSettingsUpdated', handleSettingsUpdate);
        };
    }, [selectedStats]);

    // GSAP animations
    useEffect(() => {
        if (loading) return;

        // Animate title
        if (titleRef.current) {
            gsap.from(titleRef.current, {
                opacity: 0,
                y: -20,
                duration: 0.6,
                ease: 'power3.out',
            });
        }
    }, [loading]);

    // Animate tab content on change
    useEffect(() => {
        if (tabContentRef.current) {
            gsap.to(tabContentRef.current, {
                opacity: 0,
                y: -10,
                duration: 0.2,
                ease: 'power2.in',
                onComplete: () => {
                    gsap.fromTo(tabContentRef.current, 
                        { opacity: 0, y: 10 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.4,
                            ease: 'power2.out',
                        }
                    );
                }
            });
        }
    }, [activeTab]);

    // Animate stat cards with stagger
    useEffect(() => {
        if (loading || activeTab !== 'stats' || !stats) return;

        // Use a ref to track if we've animated for this stats version
        // Combine settingsVersion with activeTab to ensure animation on tab switch
        const currentAnimationKey = `stats-${settingsVersion}-${activeTab}`;
        if (hasAnimatedRef.current === currentAnimationKey) return;

        if (statCardsRef.current) {
            const cards = statCardsRef.current.children;
            
            // Reset initial state
            gsap.set(cards, { opacity: 0, y: 30, scale: 0.9 });
            
            // Animate cards appearance
            gsap.to(cards, {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.6,
                stagger: 0.1,
                ease: 'back.out(1.7)',
            });

            // Animate number counting for stat values
            const valueElements = statCardsRef.current.querySelectorAll('.stat-value');
            valueElements.forEach((element) => {
                const originalText = element.textContent || '';
                const isCurrency = originalText.includes('$');
                
                // Extract number from text (handles both currency and plain numbers)
                let targetValue = 0;
                if (isCurrency) {
                    // For currency: extract number after $
                    const match = originalText.match(/\$?([\d,]+\.?\d*)/);
                    if (match) {
                        targetValue = parseFloat(match[1].replace(/,/g, ''));
                    }
                } else {
                    // For plain numbers
                    const match = originalText.match(/([\d,]+)/);
                    if (match) {
                        targetValue = parseInt(match[1].replace(/,/g, ''));
                    }
                }

                if (!isNaN(targetValue)) {
                    // Store original text for formatting
                    const originalTextValue = originalText;
                    
                    // Set initial value to 0
                    if (isCurrency) {
                        element.textContent = '$0';
                    } else {
                        element.textContent = '0';
                    }

                    // Animate counting (works for zero values too)
                    gsap.to({ value: 0 }, {
                        value: targetValue,
                        duration: 1.5,
                        ease: 'power2.out',
                        onUpdate: function() {
                            const currentValue = this.targets()[0].value;
                            if (isCurrency) {
                                // For currency values, check if original had decimals
                                if (originalTextValue.includes('.') && !originalTextValue.match(/\.00/)) {
                                    element.textContent = `$${currentValue.toFixed(2)}`;
                                } else {
                                    element.textContent = `$${Math.floor(currentValue).toLocaleString()}`;
                                }
                            } else {
                                element.textContent = Math.floor(currentValue).toLocaleString();
                            }
                        },
                        delay: 0.3,
                    });
                }
            });
            
            // Mark as animated with the current key
            hasAnimatedRef.current = currentAnimationKey;
        }
    }, [loading, stats, activeTab, settingsVersion]);

    // Animate charts with scroll trigger
    useEffect(() => {
        if (loading || activeTab !== 'charts') return;

        if (chartsRef.current) {
            const chartContainers = chartsRef.current.querySelectorAll('.chart-container');
            chartContainers.forEach((container, index) => {
                gsap.from(container, {
                    opacity: 0,
                    y: 50,
                    scale: 0.95,
                    duration: 0.8,
                    delay: index * 0.1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: container as HTMLElement,
                        start: 'top 85%',
                        toggleActions: 'play none none none',
                    },
                });
            });
        }
    }, [loading, activeTab]);

    // Prepare chart data with enhanced gradients
    const dailyRevenueData = stats ? {
        labels: Object.keys(stats.dailyRevenue).map(date => {
            const d = new Date(date);
            return `${d.getMonth() + 1}/${d.getDate()}`;
        }),
        datasets: [{
            label: 'Revenue ($)',
            data: Object.values(stats.dailyRevenue),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: (context: any) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
                gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.15)');
                gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
                return gradient;
            },
            fill: true,
            tension: 0.5,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: 'rgb(59, 130, 246)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: 'rgb(37, 99, 235)',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 3,
        }]
    } : null;

    const dailyOrdersData = stats ? {
        labels: Object.keys(stats.dailyOrders).map(date => {
            const d = new Date(date);
            return `${d.getMonth() + 1}/${d.getDate()}`;
        }),
        datasets: [{
            label: 'Orders',
            data: Object.values(stats.dailyOrders),
            backgroundColor: (context: any) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, 'rgba(16, 185, 129, 0.9)');
                gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.7)');
                gradient.addColorStop(1, 'rgba(16, 185, 129, 0.5)');
                return gradient;
            },
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
        }]
    } : null;

    const monthlyRevenueData = stats ? {
        labels: Object.keys(stats.monthlyRevenue).sort().map(month => {
            const [year, m] = month.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[parseInt(m) - 1]} ${year}`;
        }),
        datasets: [{
            label: 'Monthly Revenue ($)',
            data: Object.keys(stats.monthlyRevenue).sort().map(key => stats.monthlyRevenue[key]),
            backgroundColor: (context: any) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, 'rgba(139, 92, 246, 0.9)');
                gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.7)');
                gradient.addColorStop(1, 'rgba(139, 92, 246, 0.5)');
                return gradient;
            },
            borderColor: 'rgb(139, 92, 246)',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
        }]
    } : null;

    const ordersByStatusData = stats ? {
        labels: Object.keys(stats.ordersByStatus),
        datasets: [{
            data: Object.values(stats.ordersByStatus),
            backgroundColor: [
                'rgba(239, 68, 68, 0.9)',
                'rgba(34, 197, 94, 0.9)',
                'rgba(59, 130, 246, 0.9)',
                'rgba(251, 146, 60, 0.9)',
                'rgba(168, 85, 247, 0.9)',
            ],
            borderColor: [
                'rgb(239, 68, 68)',
                'rgb(34, 197, 94)',
                'rgb(59, 130, 246)',
                'rgb(251, 146, 60)',
                'rgb(168, 85, 247)',
            ],
            borderWidth: 3,
            hoverOffset: 8,
        }]
    } : null;

    const productsByCategoryData = stats ? {
        labels: Object.keys(stats.productsByCategory),
        datasets: [{
            data: Object.values(stats.productsByCategory),
            backgroundColor: [
                'rgba(59, 130, 246, 0.9)',
                'rgba(16, 185, 129, 0.9)',
                'rgba(251, 146, 60, 0.9)',
                'rgba(239, 68, 68, 0.9)',
                'rgba(168, 85, 247, 0.9)',
                'rgba(236, 72, 153, 0.9)',
            ],
            borderColor: [
                'rgb(59, 130, 246)',
                'rgb(16, 185, 129)',
                'rgb(251, 146, 60)',
                'rgb(239, 68, 68)',
                'rgb(168, 85, 247)',
                'rgb(236, 72, 153)',
            ],
            borderWidth: 3,
            hoverOffset: 8,
        }]
    } : null;

    const revenueByCategoryData = stats ? {
        labels: Object.keys(stats.revenueByCategory),
        datasets: [{
            label: 'Revenue ($)',
            data: Object.values(stats.revenueByCategory),
            backgroundColor: (context: any) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, 'rgba(34, 197, 94, 0.9)');
                gradient.addColorStop(0.5, 'rgba(34, 197, 94, 0.7)');
                gradient.addColorStop(1, 'rgba(34, 197, 94, 0.5)');
                return gradient;
            },
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
        }]
    } : null;

    const ordersByCategoryData = stats ? {
        labels: Object.keys(stats.ordersByCategory),
        datasets: [{
            data: Object.values(stats.ordersByCategory),
            backgroundColor: [
                'rgba(139, 92, 246, 0.9)',
                'rgba(59, 130, 246, 0.9)',
                'rgba(16, 185, 129, 0.9)',
                'rgba(251, 146, 60, 0.9)',
                'rgba(239, 68, 68, 0.9)',
                'rgba(168, 85, 247, 0.9)',
                'rgba(236, 72, 153, 0.9)',
            ],
            borderColor: [
                'rgb(139, 92, 246)',
                'rgb(59, 130, 246)',
                'rgb(16, 185, 129)',
                'rgb(251, 146, 60)',
                'rgb(239, 68, 68)',
                'rgb(168, 85, 247)',
                'rgb(236, 72, 153)',
            ],
            borderWidth: 3,
            hoverOffset: 8,
        }]
    } : null;

    const ordersByUserTypeData = stats ? {
        labels: Object.keys(stats.ordersByUserType).map(date => {
            const d = new Date(date);
            return `${d.getMonth() + 1}/${d.getDate()}`;
        }),
        datasets: [
            {
                label: 'Orders from Signed-Up Users',
                data: Object.values(stats.ordersByUserType).map(item => item.signedUp),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
                    gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.15)');
                    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
                    return gradient;
                },
                fill: true,
                tension: 0.5,
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: 'rgb(59, 130, 246)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            },
            {
                label: 'Orders from Guest Users',
                data: Object.values(stats.ordersByUserType).map(item => item.guest),
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
                    gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.15)');
                    gradient.addColorStop(1, 'rgba(239, 68, 68, 0.05)');
                    return gradient;
                },
                fill: true,
                tension: 0.5,
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: 'rgb(239, 68, 68)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            },
            {
                label: 'Newsletter Subscribers',
                data: Object.values(stats.dailyNewsletterSubscribers),
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
                    gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.15)');
                    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)');
                    return gradient;
                },
                fill: true,
                tension: 0.5,
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: 'rgb(16, 185, 129)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            }
        ]
    } : null;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1500,
            easing: 'easeInOutQuart' as const,
        },
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        size: 12,
                        weight: 'bold' as const,
                    },
                    color: 'rgb(63, 63, 70)',
                },
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                padding: 16,
                titleFont: {
                    size: 14,
                    weight: 'bold' as const,
                },
                bodyFont: {
                    size: 13,
                },
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                cornerRadius: 12,
                displayColors: true,
                callbacks: {
                    label: function(context: any) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD'
                            }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                    drawBorder: false,
                },
                ticks: {
                    font: {
                        size: 11,
                    },
                    color: 'rgb(113, 113, 122)',
                    callback: function(value: any) {
                        if (typeof value === 'number') {
                            return '$' + value.toLocaleString();
                        }
                        return value;
                    }
                },
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    font: {
                        size: 11,
                    },
                    color: 'rgb(113, 113, 122)',
                },
            },
        },
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1500,
            easing: 'easeInOutQuart' as const,
            animateRotate: true,
            animateScale: true,
        },
        plugins: {
            legend: {
                display: true,
                position: 'right' as const,
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        size: 12,
                        weight: 'bold' as const,
                    },
                    color: 'rgb(63, 63, 70)',
                },
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                padding: 16,
                titleFont: {
                    size: 14,
                    weight: 'bold' as const,
                },
                bodyFont: {
                    size: 13,
                },
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                cornerRadius: 12,
                displayColors: true,
                callbacks: {
                    label: function(context: any) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            },
        },
    };

    const statCards = [
        {
            id: 'totalRevenue',
            title: 'Total Revenue',
            value: `$${stats?.totalRevenue.toLocaleString() || '0'}`,
            icon: DollarSign,
            change: stats ? `+$${stats.recentRevenue.toLocaleString()} (30d)` : null,
            trend: 'up' as const,
            gradient: 'from-blue-500 to-cyan-500',
            bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
        },
        {
            id: 'totalOrders',
            title: 'Total Orders',
            value: stats?.totalOrders || 0,
            icon: ShoppingBag,
            href: '/admin/orders',
            change: stats ? `${stats.completedOrders} completed` : null,
            gradient: 'from-green-500 to-emerald-500',
            bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
        },
        {
            id: 'totalProducts',
            title: 'Total Products',
            value: stats?.totalProducts || 0,
            icon: Package,
            href: '/admin/products',
            gradient: 'from-purple-500 to-pink-500',
            bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
        },
        {
            id: 'totalUsers',
            title: 'Total Users',
            value: stats?.totalUsers || 0,
            icon: Users,
            href: '/admin/users',
            gradient: 'from-orange-500 to-red-500',
            bgGradient: 'from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20',
        },
        {
            id: 'averageOrderValue',
            title: 'Avg Order Value',
            value: `$${stats?.averageOrderValue.toFixed(2) || '0.00'}`,
            icon: TrendingUp,
            gradient: 'from-indigo-500 to-blue-500',
            bgGradient: 'from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20',
        },
        {
            id: 'pendingOrders',
            title: 'Pending Orders',
            value: stats?.pendingOrders || 0,
            icon: Clock,
            href: '/admin/orders',
            gradient: 'from-yellow-500 to-amber-500',
            bgGradient: 'from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20',
        },
        {
            id: 'weekRevenue',
            title: 'Week Revenue',
            value: `$${stats?.weekRevenue.toLocaleString() || '0'}`,
            icon: Activity,
            gradient: 'from-teal-500 to-cyan-500',
            bgGradient: 'from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20',
        },
        {
            id: 'abandonedCarts',
            title: 'Abandoned Carts',
            value: stats?.abandonedCarts || 0,
            icon: ShoppingBag,
            href: '/admin/abandoned-carts',
            gradient: 'from-rose-500 to-pink-500',
            bgGradient: 'from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20',
        },
    ];

    // Filter stat cards based on selected stats
    // Always include abandonedCarts even if not in selectedStats
    const filteredStatCards = selectedStats.length > 0 
        ? statCards.filter(card => selectedStats.includes(card.id) || card.id === 'abandonedCarts')
        : statCards;

    const tabs = [
        { id: 'stats', label: 'Statistics', icon: LayoutDashboard },
        { id: 'charts', label: 'Charts', icon: LineChart },
        { id: 'recent', label: 'Recent Activity', icon: List },
    ];

    return (
        <div className="space-y-6 sm:space-y-10">
            <div ref={titleRef} className="flex flex-col gap-1">
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">
                    Dashboard
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Welcome back, Administrator.</p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'stats' | 'charts' | 'recent')}
                            className={`flex items-center gap-2 px-4 py-2 font-bold transition-colors relative cursor-pointer ${
                                activeTab === tab.id
                                    ? "text-black dark:text-white"
                                    : "text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                            }`}
                        >
                            <Icon size={18} />
                            <span>{tab.label}</span>
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div ref={tabContentRef}>

            {/* Stats Tab */}
            {activeTab === 'stats' && (
                <div className="space-y-6">
                    {/* Stats Grid */}
                    <div ref={statCardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {filteredStatCards.map((card, index) => {
                    const CardContent = (
                        <>
                            <div className="flex-1 relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-600 transition-colors dark:text-zinc-400 dark:group-hover:text-zinc-300">
                                    {card.title}
                                </p>
                                <h3 className="text-2xl sm:text-3xl font-black mt-1">
                                    {loading ? (
                                        <div className="h-8 w-16 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
                                    ) : (
                                        <span className={`stat-value bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                                            {card.value}
                                        </span>
                                    )}
                                </h3>
                                {card.change && (
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                                        {card.trend === 'up' ? (
                                            <ArrowUp size={12} className="text-green-500" />
                                        ) : (
                                            <ArrowDown size={12} className="text-red-500" />
                                        )}
                                        {card.change}
                                    </p>
                                )}
                            </div>
                            <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${card.gradient} text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                                <div className="absolute inset-0 bg-white/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                                <card.icon size={24} className="relative z-10" />
                            </div>
                        </>
                    );

                    const commonClasses =
                        `relative overflow-hidden bg-gradient-to-br ${card.bgGradient} p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg flex items-center justify-between group hover:shadow-xl hover:scale-[1.02] transition-all duration-300`;

                    return card.href ? (
                        <Link key={card.id} href={card.href} className={`${commonClasses} cursor-pointer`}>
                            {CardContent}
                        </Link>
                    ) : (
                        <div key={card.id} className={`${commonClasses} cursor-default`}>
                            {CardContent}
                        </div>
                    );
                })}
                    </div>

                    {/* Charts Section in Statistics Tab */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue Last 30 Days Chart */}
                        <div className="chart-container bg-gradient-to-br from-white to-blue-50/30 dark:from-zinc-900 dark:to-blue-950/20 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg p-6 hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                    <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <h2 className="font-bold text-zinc-900 dark:text-white">Revenue Trend (30 Days)</h2>
                            </div>
                            <div className="h-64">
                                {loading ? (
                                    <div className="h-full flex items-center justify-center">
                                        <Skeleton className="h-full w-full" />
                                    </div>
                                ) : dailyRevenueData ? (
                                    <Line data={dailyRevenueData} options={chartOptions} />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-zinc-500">No data available</div>
                                )}
                            </div>
                        </div>

                        {/* Orders by User Type and Newsletter Subscribers Chart */}
                        <div className="chart-container bg-gradient-to-br from-white to-indigo-50/30 dark:from-zinc-900 dark:to-indigo-950/20 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg p-6 hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                                    <LineChart size={20} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h2 className="font-bold text-zinc-900 dark:text-white">Orders & Newsletter Subscribers</h2>
                            </div>
                            <div className="h-64">
                                {loading ? (
                                    <div className="h-full flex items-center justify-center">
                                        <Skeleton className="h-full w-full" />
                                    </div>
                                ) : ordersByUserTypeData ? (
                                    <Line data={ordersByUserTypeData} options={{
                                        ...chartOptions,
                                        scales: {
                                            ...chartOptions.scales,
                                            y: {
                                                ...chartOptions.scales.y,
                                                ticks: {
                                                    ...chartOptions.scales.y.ticks,
                                                    callback: function(value: any) {
                                                        if (typeof value === 'number') {
                                                            return value.toLocaleString();
                                                        }
                                                        return value;
                                                    }
                                                }
                                            }
                                        }
                                    }} />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-zinc-500">No data available</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Tab */}
            {activeTab === 'charts' && (
                <div className="space-y-6">
                    {/* Charts Section */}
                    <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orders Over Time */}
                <div className="chart-container bg-gradient-to-br from-white to-green-50/30 dark:from-zinc-900 dark:to-green-950/20 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <Activity size={20} className="text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="font-bold text-zinc-900 dark:text-white">Orders (Last 30 Days)</h2>
                    </div>
                    <div className="h-64">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <Skeleton className="h-full w-full" />
                            </div>
                        ) : dailyOrdersData ? (
                            <Bar data={dailyOrdersData} options={chartOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-zinc-500">No data available</div>
                        )}
                    </div>
                </div>

                {/* Monthly Revenue */}
                <div className="chart-container bg-gradient-to-br from-white to-purple-50/30 dark:from-zinc-900 dark:to-purple-950/20 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                            <TrendingUp size={20} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <h2 className="font-bold text-zinc-900 dark:text-white">Monthly Revenue</h2>
                    </div>
                    <div className="h-64">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <Skeleton className="h-full w-full" />
                            </div>
                        ) : monthlyRevenueData ? (
                            <Bar data={monthlyRevenueData} options={chartOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-zinc-500">No data available</div>
                        )}
                    </div>
                </div>

                {/* Orders by Status */}
                <div className="chart-container bg-gradient-to-br from-white to-orange-50/30 dark:from-zinc-900 dark:to-orange-950/20 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                            <PieChart size={20} className="text-orange-600 dark:text-orange-400" />
                        </div>
                        <h2 className="font-bold text-zinc-900 dark:text-white">Orders by Status</h2>
                    </div>
                    <div className="h-64">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <Skeleton className="h-full w-full" />
                            </div>
                        ) : ordersByStatusData ? (
                            <Doughnut data={ordersByStatusData} options={doughnutOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-zinc-500">No data available</div>
                        )}
                    </div>
                </div>

                {/* Products by Category */}
                <div className="chart-container bg-gradient-to-br from-white to-pink-50/30 dark:from-zinc-900 dark:to-pink-950/20 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                            <Package size={20} className="text-pink-600 dark:text-pink-400" />
                        </div>
                        <h2 className="font-bold text-zinc-900 dark:text-white">Products by Category</h2>
                    </div>
                    <div className="h-64">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <Skeleton className="h-full w-full" />
                            </div>
                        ) : productsByCategoryData ? (
                            <Doughnut data={productsByCategoryData} options={doughnutOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-zinc-500">No data available</div>
                        )}
                    </div>
                </div>

                {/* Revenue by Category */}
                <div className="chart-container bg-gradient-to-br from-white to-emerald-50/30 dark:from-zinc-900 dark:to-emerald-950/20 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                            <DollarSign size={20} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="font-bold text-zinc-900 dark:text-white">Revenue by Category</h2>
                    </div>
                    <div className="h-64">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <Skeleton className="h-full w-full" />
                            </div>
                        ) : revenueByCategoryData ? (
                            <Bar data={revenueByCategoryData} options={chartOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-zinc-500">No data available</div>
                        )}
                    </div>
                    </div>
                    </div>

                    {/* Custom Charts Section */}
                    {customCharts.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">
                                    Custom Charts
                                </h2>
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Your custom visualizations</p>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {customCharts
                                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                                    .map((chart) => (
                                        <CustomChartCard key={chart.id} chart={chart} />
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Recent Activity Tab */}
            {activeTab === 'recent' && (
                <div className="space-y-6">
                    {/* Top Products & Recent Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={20} className="text-zinc-400" />
                            <h2 className="font-bold text-zinc-900 dark:text-white">Top Products by Revenue</h2>
                        </div>
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <div key={index} className="p-4">
                                    <Skeleton className="h-5 w-32 mb-2" />
                                    <Skeleton className="h-4 w-40" />
                                </div>
                            ))
                        ) : stats?.topProducts && stats.topProducts.length > 0 ? (
                            stats.topProducts.map((product, index) => (
                                <div key={product.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 text-sm">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="font-medium text-zinc-900 dark:text-white truncate max-w-[200px]">
                                                    {product.name}
                                                </div>
                                                <div className="text-sm text-zinc-500">
                                                    {product.quantity} sold
                                                </div>
                                            </div>
                                        </div>
                                        <div className="font-bold text-zinc-900 dark:text-white">
                                            ${product.revenue.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-zinc-500">No products yet.</div>
                        )}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock size={20} className="text-zinc-400" />
                            <h2 className="font-bold text-zinc-900 dark:text-white">Recent Orders</h2>
                        </div>
                        <Link
                            href="/admin/orders"
                            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                            View All <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <div key={index} className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <Skeleton className="h-5 w-32 mb-2" />
                                            <Skeleton className="h-4 w-40" />
                                        </div>
                                        <Skeleton className="h-5 w-16" />
                                    </div>
                                </div>
                            ))
                        ) : recentOrders.length > 0 ? (
                            recentOrders.map((order) => (
                                <Link
                                    key={order.id}
                                    href={`/admin/orders?id=${order.id}`}
                                    className="block p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-zinc-900 dark:text-white">
                                                Order #{order.id.toString().slice(-6)}
                                            </div>
                                            <div className="text-sm text-zinc-500">
                                                {order.status} • {new Date(order.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="font-bold text-zinc-900 dark:text-white">
                                            ${(order.total || order.totalAmount || 0).toFixed(2)}
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="p-8 text-center text-zinc-500">No orders yet.</div>
                        )}
                    </div>
                </div>
                    </div>

                    {/* New Users */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users size={20} className="text-zinc-400" />
                                <h2 className="font-bold text-zinc-900 dark:text-white">New Users</h2>
                            </div>
                            <Link
                                href="/admin/users"
                                className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                                View All <ChevronRight size={16} />
                            </Link>
                        </div>
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <div key={index} className="flex items-center gap-4 p-4">
                                        <Skeleton variant="circular" className="h-10 w-10" />
                                        <div className="flex-1 min-w-0">
                                            <Skeleton className="h-5 w-32 mb-2" />
                                            <Skeleton className="h-4 w-40" />
                                        </div>
                                        <Skeleton className="h-6 w-16 rounded-full" />
                                    </div>
                                ))
                            ) : recentUsers.length > 0 ? (
                                recentUsers.map((user) => (
                                    <Link
                                        key={user.id}
                                        href={`/admin/users?id=${user.id}`}
                                        className="flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                                    >
                                        <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-zinc-900 dark:text-white truncate">{user.name}</div>
                                            <div className="text-sm text-zinc-500 truncate">{user.email}</div>
                                        </div>
                                        <div className="text-xs font-medium px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                            {user.role}
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="p-8 text-center text-zinc-500">No users yet.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
