'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/utils/api';
import { useToast } from '@/contexts';
import { Save, X, Eye } from 'lucide-react';
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
    Filler,
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

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

interface CustomChartBuilderProps {
    chart?: any;
    onSave: () => void;
    onCancel: () => void;
}

const DATA_SOURCES = [
    { value: 'orders', label: 'Orders' },
    { value: 'products', label: 'Products' },
    { value: 'users', label: 'Users' },
    { value: 'reviews', label: 'Reviews' },
    { value: 'categories', label: 'Categories' },
    { value: 'payments', label: 'Payments' },
];

const CHART_TYPES = [
    { value: 'line', label: 'Line Chart' },
    { value: 'bar', label: 'Bar Chart' },
    { value: 'pie', label: 'Pie Chart' },
    { value: 'doughnut', label: 'Doughnut Chart' },
    { value: 'area', label: 'Area Chart' },
];

export default function CustomChartBuilder({ chart, onSave, onCancel }: CustomChartBuilderProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: chart?.name || '',
        type: chart?.type || 'line',
        dataSource: chart?.dataSource || 'orders',
        xAxis: {
            field: chart?.xAxis?.field || 'createdAt',
            grouping: chart?.xAxis?.grouping || 'day',
        },
        yAxis: {
            field: chart?.yAxis?.field || 'totalAmount',
            aggregation: chart?.yAxis?.aggregation || 'sum',
        },
        filters: chart?.filters || {},
        colors: chart?.colors || [],
        order: chart?.order || 0,
    });

    const getXAxisFields = () => {
        switch (formData.dataSource) {
            case 'orders':
                return [
                    { value: 'createdAt', label: 'Date' },
                    { value: 'status', label: 'Status' },
                ];
            case 'products':
                return [
                    { value: 'category', label: 'Category' },
                    { value: 'createdAt', label: 'Date' },
                ];
            case 'users':
                return [
                    { value: 'createdAt', label: 'Date' },
                    { value: 'role', label: 'Role' },
                ];
            case 'reviews':
                return [
                    { value: 'createdAt', label: 'Date' },
                    { value: 'rating', label: 'Rating' },
                ];
            case 'categories':
                return [
                    { value: 'name', label: 'Category Name' },
                ];
            case 'payments':
                return [
                    { value: 'paymentMethod', label: 'Payment Method' },
                    { value: 'createdAt', label: 'Date' },
                ];
            default:
                return [];
        }
    };

    const getYAxisFields = () => {
        switch (formData.dataSource) {
            case 'orders':
                return [
                    { value: 'totalAmount', label: 'Total Amount' },
                    { value: 'count', label: 'Count' },
                    { value: 'itemsCount', label: 'Items Count' },
                ];
            case 'products':
                return [
                    { value: 'price', label: 'Price' },
                    { value: 'stock', label: 'Stock' },
                    { value: 'salesCount', label: 'Sales Count' },
                    { value: 'reviewsCount', label: 'Reviews Count' },
                    { value: 'count', label: 'Count' },
                ];
            case 'users':
                return [
                    { value: 'ordersCount', label: 'Orders Count' },
                    { value: 'count', label: 'Count' },
                ];
            case 'reviews':
                return [
                    { value: 'rating', label: 'Rating' },
                    { value: 'count', label: 'Count' },
                ];
            case 'categories':
                return [
                    { value: 'productCount', label: 'Product Count' },
                    { value: 'count', label: 'Count' },
                ];
            case 'payments':
                return [
                    { value: 'totalAmount', label: 'Total Amount' },
                    { value: 'count', label: 'Count' },
                ];
            default:
                return [];
        }
    };

    const handlePreview = async () => {
        if (!formData.name || !formData.type || !formData.dataSource) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        setPreviewLoading(true);
        try {
            // Create a temporary chart config for preview
            const tempChart = {
                ...formData,
                id: 'preview',
            };

            const response = await apiFetch(`/admin/custom-charts/preview`, {
                method: 'POST',
                body: tempChart,
            });

            setPreviewData(response.data.chartData);
        } catch (error: any) {
            console.error('Preview error:', error);
            showToast('Failed to generate preview', 'error');
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.type || !formData.dataSource) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        setLoading(true);
        try {
            if (chart?.id) {
                await apiFetch(`/admin/custom-charts/${chart.id}`, {
                    method: 'PUT',
                    body: formData,
                });
                showToast('Chart updated successfully', 'success');
            } else {
                await apiFetch('/admin/custom-charts', {
                    method: 'POST',
                    body: formData,
                });
                showToast('Chart created successfully', 'success');
            }
            onSave();
        } catch (error: any) {
            console.error('Save error:', error);
            showToast('Failed to save chart', 'error');
        } finally {
            setLoading(false);
        }
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
            },
            tooltip: {
                enabled: true,
            },
        },
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Section */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                            Chart Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                            placeholder="Enter chart name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                            Chart Type *
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                        >
                            {CHART_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                            Data Source *
                        </label>
                        <select
                            value={formData.dataSource}
                            onChange={(e) => {
                                setFormData({
                                    ...formData,
                                    dataSource: e.target.value,
                                    xAxis: { field: 'createdAt', grouping: 'day' },
                                    yAxis: { field: 'totalAmount', aggregation: 'sum' },
                                });
                            }}
                            className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                        >
                            {DATA_SOURCES.map((source) => (
                                <option key={source.value} value={source.value}>
                                    {source.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                            X-Axis Field *
                        </label>
                        <select
                            value={formData.xAxis.field}
                            onChange={(e) => setFormData({
                                ...formData,
                                xAxis: { ...formData.xAxis, field: e.target.value },
                            })}
                            className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                        >
                            {getXAxisFields().map((field) => (
                                <option key={field.value} value={field.value}>
                                    {field.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {formData.xAxis.field === 'createdAt' && (
                        <div>
                            <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                                Date Grouping
                            </label>
                            <select
                                value={formData.xAxis.grouping}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    xAxis: { ...formData.xAxis, grouping: e.target.value },
                                })}
                                className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                            >
                                <option value="day">Day</option>
                                <option value="week">Week</option>
                                <option value="month">Month</option>
                                <option value="year">Year</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                            Y-Axis Field *
                        </label>
                        <select
                            value={formData.yAxis.field}
                            onChange={(e) => setFormData({
                                ...formData,
                                yAxis: { ...formData.yAxis, field: e.target.value },
                            })}
                            className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                        >
                            {getYAxisFields().map((field) => (
                                <option key={field.value} value={field.value}>
                                    {field.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                            Aggregation *
                        </label>
                        <select
                            value={formData.yAxis.aggregation}
                            onChange={(e) => setFormData({
                                ...formData,
                                yAxis: { ...formData.yAxis, aggregation: e.target.value },
                            })}
                            className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                        >
                            <option value="sum">Sum</option>
                            <option value="count">Count</option>
                            <option value="avg">Average</option>
                            <option value="min">Minimum</option>
                            <option value="max">Maximum</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                            Order (Display Priority)
                        </label>
                        <input
                            type="number"
                            value={formData.order}
                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold hover:opacity-80 transition-opacity disabled:opacity-50"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : chart?.id ? 'Update Chart' : 'Create Chart'}
                        </button>
                        <button
                            onClick={handlePreview}
                            disabled={previewLoading}
                            className="flex items-center gap-2 px-6 py-3 border border-zinc-200 dark:border-zinc-700 rounded-lg font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            <Eye size={18} />
                            {previewLoading ? 'Loading...' : 'Preview'}
                        </button>
                        <button
                            onClick={onCancel}
                            className="flex items-center gap-2 px-6 py-3 border border-zinc-200 dark:border-zinc-700 rounded-lg font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <X size={18} />
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
                    <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Preview</h3>
                    <div className="h-64">
                        {previewLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-zinc-500">Loading preview...</div>
                            </div>
                        ) : previewData ? (
                            (() => {
                                const chartData = {
                                    labels: previewData.labels,
                                    datasets: previewData.datasets.map((ds: any) => ({
                                        ...ds,
                                        backgroundColor: formData.colors.length > 0
                                            ? formData.colors
                                            : ds.backgroundColor,
                                    })),
                                };

                                switch (formData.type) {
                                    case 'line':
                                    case 'area':
                                        return <Line data={chartData} options={chartOptions} />;
                                    case 'bar':
                                        return <Bar data={chartData} options={chartOptions} />;
                                    case 'pie':
                                        return <Pie data={chartData} options={chartOptions} />;
                                    case 'doughnut':
                                        return <Doughnut data={chartData} options={chartOptions} />;
                                    default:
                                        return <Line data={chartData} options={chartOptions} />;
                                }
                            })()
                        ) : (
                            <div className="h-full flex items-center justify-center text-zinc-500">
                                Click Preview to see chart
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

