import prisma from "../db.js";

interface ChartConfig {
  dataSource: string;
  xAxis: {
    field: string;
    grouping?: string;
  };
  yAxis: {
    field: string;
    aggregation: string;
  };
  filters?: {
    dateRange?: { start: string; end: string };
    status?: string[];
    category?: string[];
    role?: string[];
    isApproved?: boolean;
  };
}

export async function processChartData(chart: ChartConfig & { type: string; name: string }) {
  const { dataSource, xAxis, yAxis, filters } = chart;

  let rawData: any[] = [];
  let labels: string[] = [];
  let data: number[] = [];

  // Fetch raw data based on data source
  switch (dataSource) {
    case "orders":
      rawData = await fetchOrdersData(filters);
      break;
    case "products":
      rawData = await fetchProductsData(filters);
      break;
    case "users":
      rawData = await fetchUsersData(filters);
      break;
    case "reviews":
      rawData = await fetchReviewsData(filters);
      break;
    case "categories":
      rawData = await fetchCategoriesData(filters);
      break;
    case "payments":
      rawData = await fetchPaymentsData(filters);
      break;
    default:
      throw new Error(`Unknown data source: ${dataSource}`);
  }

  // Process data based on X-axis grouping
  const grouped = groupData(rawData, xAxis, yAxis, dataSource);

  // Extract labels and data
  labels = Object.keys(grouped).sort();
  data = labels.map((label) => grouped[label]);

  return {
    labels,
    datasets: [
      {
        label: yAxis.field,
        data,
      },
    ],
  };
}

async function fetchOrdersData(filters?: any) {
  const where: any = {};

  if (filters?.dateRange) {
    where.createdAt = {
      gte: new Date(filters.dateRange.start),
      lte: new Date(filters.dateRange.end),
    };
  }

  if (filters?.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  return orders;
}

async function fetchProductsData(filters?: any) {
  const where: any = {};

  if (filters?.category && filters.category.length > 0) {
    where.category = { in: filters.category };
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      orderItems: true,
      reviews: true,
    },
  });

  return products;
}

async function fetchUsersData(filters?: any) {
  const where: any = {};

  if (filters?.dateRange) {
    where.createdAt = {
      gte: new Date(filters.dateRange.start),
      lte: new Date(filters.dateRange.end),
    };
  }

  if (filters?.role && filters.role.length > 0) {
    where.role = { in: filters.role };
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      orders: true,
    },
  });

  return users;
}

async function fetchReviewsData(filters?: any) {
  const where: any = {};

  if (filters?.dateRange) {
    where.createdAt = {
      gte: new Date(filters.dateRange.start),
      lte: new Date(filters.dateRange.end),
    };
  }

  if (filters?.isApproved !== undefined) {
    where.isApproved = filters.isApproved;
  }

  const reviews = await prisma.review.findMany({
    where,
    include: {
      product: true,
    },
  });

  return reviews;
}

async function fetchCategoriesData(filters?: any) {
  const categories = await prisma.category.findMany({
    include: {
      // Note: Category doesn't have direct relation, we'll need to count products
    },
  });

  // Get product counts per category
  const products = await prisma.product.findMany({
    select: {
      category: true,
    },
  });

  return categories.map((cat) => ({
    ...cat,
    productCount: products.filter((p) => p.category === cat.name).length,
  }));
}

async function fetchPaymentsData(filters?: any) {
  // Payments are stored in orders as paymentMethod
  const where: any = {};

  if (filters?.dateRange) {
    where.createdAt = {
      gte: new Date(filters.dateRange.start),
      lte: new Date(filters.dateRange.end),
    };
  }

  const orders = await prisma.order.findMany({
    where,
    select: {
      paymentMethod: true,
      totalAmount: true,
      createdAt: true,
    },
  });

  return orders;
}

function groupData(
  rawData: any[],
  xAxis: { field: string; grouping?: string },
  yAxis: { field: string; aggregation: string },
  dataSource: string
): Record<string, number> {
  const grouped: Record<string, number> = {};

  rawData.forEach((item) => {
    let key: string;

    // Determine grouping key based on xAxis field and grouping type
    if (xAxis.grouping === "day" || xAxis.grouping === "week" || xAxis.grouping === "month" || xAxis.grouping === "year") {
      const date = new Date(item[xAxis.field] || item.createdAt);
      key = formatDateByGrouping(date, xAxis.grouping);
    } else if (xAxis.grouping === "category") {
      key = item.category || item.product?.category || "Unknown";
    } else if (xAxis.grouping === "status") {
      key = item.status || "Unknown";
    } else {
      key = item[xAxis.field] || "Unknown";
    }

    // Initialize if not exists
    if (!grouped[key]) {
      grouped[key] = 0;
    }

    // Aggregate Y-axis value
    let value: number = 0;

    if (dataSource === "orders") {
      if (yAxis.field === "totalAmount") {
        value = item.totalAmount || 0;
      } else if (yAxis.field === "count") {
        value = 1;
      } else if (yAxis.field === "itemsCount") {
        value = item.items?.length || 0;
      }
    } else if (dataSource === "products") {
      if (yAxis.field === "price") {
        value = item.price || 0;
      } else if (yAxis.field === "stock") {
        value = item.stock || 0;
      } else if (yAxis.field === "salesCount") {
        value = item.orderItems?.reduce((sum: number, oi: any) => sum + oi.quantity, 0) || 0;
      } else if (yAxis.field === "reviewsCount") {
        value = item.reviews?.length || 0;
      } else if (yAxis.field === "count") {
        value = 1;
      }
    } else if (dataSource === "users") {
      if (yAxis.field === "ordersCount") {
        value = item.orders?.length || 0;
      } else if (yAxis.field === "count") {
        value = 1;
      }
    } else if (dataSource === "reviews") {
      if (yAxis.field === "rating") {
        value = item.rating || 0;
      } else if (yAxis.field === "count") {
        value = 1;
      }
    } else if (dataSource === "categories") {
      if (yAxis.field === "productCount") {
        value = item.productCount || 0;
      } else if (yAxis.field === "count") {
        value = 1;
      }
    } else if (dataSource === "payments") {
      if (yAxis.field === "totalAmount") {
        value = item.totalAmount || 0;
      } else if (yAxis.field === "count") {
        value = 1;
      }
    }

    // Apply aggregation
    switch (yAxis.aggregation) {
      case "sum":
        grouped[key] += value;
        break;
      case "count":
        grouped[key] += 1;
        break;
      case "avg":
        // We'll need to track counts separately for average
        if (!grouped[`${key}_count`]) {
          grouped[`${key}_count`] = 0;
          grouped[`${key}_sum`] = 0;
        }
        grouped[`${key}_count`]++;
        grouped[`${key}_sum`] += value;
        break;
      case "min":
        if (grouped[key] === 0 || value < grouped[key]) {
          grouped[key] = value;
        }
        break;
      case "max":
        if (value > grouped[key]) {
          grouped[key] = value;
        }
        break;
    }
  });

  // Process averages
  const result: Record<string, number> = {};
  Object.keys(grouped).forEach((key) => {
    if (key.endsWith("_count")) {
      const baseKey = key.replace("_count", "");
      const sum = grouped[`${baseKey}_sum`] || 0;
      const count = grouped[key] || 1;
      result[baseKey] = sum / count;
    } else if (!key.endsWith("_sum")) {
      result[key] = grouped[key];
    }
  });

  return result;
}

function formatDateByGrouping(date: Date, grouping: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const week = getWeekNumber(date);

  switch (grouping) {
    case "day":
      return `${year}-${month}-${day}`;
    case "week":
      return `${year}-W${week}`;
    case "month":
      return `${year}-${month}`;
    case "year":
      return `${year}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

