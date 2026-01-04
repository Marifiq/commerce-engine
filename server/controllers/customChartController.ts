import { Request, Response, NextFunction } from "express";
import prisma from "../db.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { UserRequest } from "../types.js";
import { processChartData } from "../utils/chartDataProcessor.js";

// Get all custom charts
export const getCustomCharts = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const setting = await prisma.settings.findUnique({
    where: { key: "customCharts" },
  });

  if (!setting || !setting.value) {
    return res.status(200).json({
      status: "success",
      data: { charts: [] },
    });
  }

  try {
    const charts = JSON.parse(setting.value);
    res.status(200).json({
      status: "success",
      data: { charts: Array.isArray(charts) ? charts : [] },
    });
  } catch (error) {
    res.status(200).json({
      status: "success",
      data: { charts: [] },
    });
  }
});

// Create new custom chart
export const createCustomChart = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { name, type, dataSource, xAxis, yAxis, filters, colors, order } = req.body;

  if (!name || !type || !dataSource || !xAxis || !yAxis) {
    return next(new AppError("Name, type, dataSource, xAxis, and yAxis are required", 400));
  }

  // Get existing charts
  const setting = await prisma.settings.findUnique({
    where: { key: "customCharts" },
  });

  let charts: any[] = [];
  if (setting && setting.value) {
    try {
      charts = JSON.parse(setting.value);
      if (!Array.isArray(charts)) charts = [];
    } catch {
      charts = [];
    }
  }

  // Create new chart
  const newChart = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name,
    type,
    dataSource,
    xAxis,
    yAxis,
    filters: filters || {},
    colors: colors || [],
    order: order !== undefined ? order : charts.length,
    createdAt: new Date().toISOString(),
  };

  charts.push(newChart);

  // Save to database
  await prisma.settings.upsert({
    where: { key: "customCharts" },
    update: { value: JSON.stringify(charts) },
    create: { key: "customCharts", value: JSON.stringify(charts) },
  });

  res.status(201).json({
    status: "success",
    data: { chart: newChart },
  });
});

// Update custom chart
export const updateCustomChart = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { name, type, dataSource, xAxis, yAxis, filters, colors, order } = req.body;

  // Get existing charts
  const setting = await prisma.settings.findUnique({
    where: { key: "customCharts" },
  });

  if (!setting || !setting.value) {
    return next(new AppError("Chart not found", 404));
  }

  let charts: any[] = [];
  try {
    charts = JSON.parse(setting.value);
    if (!Array.isArray(charts)) charts = [];
  } catch {
    return next(new AppError("Invalid charts data", 400));
  }

  const chartIndex = charts.findIndex((c) => c.id === id);
  if (chartIndex === -1) {
    return next(new AppError("Chart not found", 404));
  }

  // Update chart
  charts[chartIndex] = {
    ...charts[chartIndex],
    ...(name && { name }),
    ...(type && { type }),
    ...(dataSource && { dataSource }),
    ...(xAxis && { xAxis }),
    ...(yAxis && { yAxis }),
    ...(filters !== undefined && { filters }),
    ...(colors !== undefined && { colors }),
    ...(order !== undefined && { order }),
    updatedAt: new Date().toISOString(),
  };

  // Save to database
  await prisma.settings.update({
    where: { key: "customCharts" },
    data: { value: JSON.stringify(charts) },
  });

  res.status(200).json({
    status: "success",
    data: { chart: charts[chartIndex] },
  });
});

// Delete custom chart
export const deleteCustomChart = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  // Get existing charts
  const setting = await prisma.settings.findUnique({
    where: { key: "customCharts" },
  });

  if (!setting || !setting.value) {
    return next(new AppError("Chart not found", 404));
  }

  let charts: any[] = [];
  try {
    charts = JSON.parse(setting.value);
    if (!Array.isArray(charts)) charts = [];
  } catch {
    return next(new AppError("Invalid charts data", 400));
  }

  const filteredCharts = charts.filter((c) => c.id !== id);
  
  if (filteredCharts.length === charts.length) {
    return next(new AppError("Chart not found", 404));
  }

  // Save to database
  await prisma.settings.update({
    where: { key: "customCharts" },
    data: { value: JSON.stringify(filteredCharts) },
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Preview chart data (for builder)
export const previewChartData = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const chart = req.body;

  if (!chart.dataSource || !chart.xAxis || !chart.yAxis) {
    return next(new AppError("Chart configuration is required", 400));
  }

  // Process chart data
  const chartData = await processChartData(chart);

  res.status(200).json({
    status: "success",
    data: { chartData },
  });
});

// Get chart data based on configuration
export const getChartData = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  // Get existing charts
  const setting = await prisma.settings.findUnique({
    where: { key: "customCharts" },
  });

  if (!setting || !setting.value) {
    return next(new AppError("Chart not found", 404));
  }

  let charts: any[] = [];
  try {
    charts = JSON.parse(setting.value);
    if (!Array.isArray(charts)) charts = [];
  } catch {
    return next(new AppError("Invalid charts data", 400));
  }

  const chart = charts.find((c) => c.id === id);
  if (!chart) {
    return next(new AppError("Chart not found", 404));
  }

  // Process chart data
  const chartData = await processChartData(chart);

  res.status(200).json({
    status: "success",
    data: { chartData },
  });
});

