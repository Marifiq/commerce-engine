'use client';

import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '@/lib/utils/api';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import { BarChart3 } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

interface CustomChartCardProps {
    chart: any;
}

export default function CustomChartCard({ chart }: CustomChartCardProps) {
    const [chartData, setChartData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchChartData = async () => {
            try {
                const response = await apiFetch(`/admin/custom-charts/${chart.id}/data`);
                setChartData(response.data.chartData);
            } catch (error) {
                console.error('Failed to fetch chart data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchChartData();
    }, [chart.id]);

    useEffect(() => {
        if (!loading && chartRef.current) {
            gsap.from(chartRef.current, {
                opacity: 0,
                y: 50,
                scale: 0.95,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: chartRef.current,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                },
            });
        }
    }, [loading]);

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
            },
        },
    };

    const renderChart = () => {
        if (!chartData) return null;

        const data = {
            labels: chartData.labels,
            datasets: chartData.datasets.map((ds: any) => ({
                ...ds,
                backgroundColor: chart.colors && chart.colors.length > 0
                    ? chart.colors
                    : ds.backgroundColor,
            })),
        };

        switch (chart.type) {
            case 'line':
            case 'area':
                return <Line data={data} options={chartOptions} />;
            case 'bar':
                return <Bar data={data} options={chartOptions} />;
            case 'pie':
                return <Pie data={data} options={chartOptions} />;
            case 'doughnut':
                return <Doughnut data={data} options={chartOptions} />;
            default:
                return <Line data={data} options={chartOptions} />;
        }
    };

    return (
        <div
            ref={chartRef}
            className="chart-container bg-gradient-to-br from-white to-indigo-50/30 dark:from-zinc-900 dark:to-indigo-950/20 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg p-6 hover:shadow-xl transition-shadow"
        >
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                    <BarChart3 size={20} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="font-bold text-zinc-900 dark:text-white">{chart.name}</h2>
            </div>
            <div className="h-64">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-zinc-500">Loading chart...</div>
                    </div>
                ) : chartData ? (
                    renderChart()
                ) : (
                    <div className="h-full flex items-center justify-center text-zinc-500">
                        No data available
                    </div>
                )}
            </div>
        </div>
    );
}

