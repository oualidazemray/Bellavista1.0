// src/app/admin/reports/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  DollarSign,
  Users,
  BookOpen,
  CalendarCheck,
  AlertTriangle,
  MessageSquare,
  Star,
  Loader2,
  TrendingUp,
  PieChart as PieChartIcon,
  ListFilter,
  Calendar as CalendarIcon,
  LineChart as LineChartIcon, // For consistency if using Lucide for titles
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Sector,
} from "recharts";
// If you add a date range picker from shadcn/ui later:
// import { DateRange } from 'react-day-picker';
// import { DateRangePicker } from '@/components/ui/date-range-picker'; // Assuming this path

// --- Interfaces matching API response structures ---
interface BookingStatsSummary {
  totalReservations: number;
  totalRevenue: number;
  averageBookingValue: number;
  uniqueClients: number;
  reservationsThisMonth: number;
  revenueThisMonth: number;
  totalFeedbacks: number;
  averageFeedbackRating?: number | null;
}

interface TimeSeriesDataPoint {
  // Generic for Revenue or Bookings over time
  date: string; // YYYY-MM
  value: number; // Can be revenue or count
}
interface TimeSeriesReport {
  data: TimeSeriesDataPoint[];
  totalValueInPeriod: number;
}

interface RoomTypeDistributionDataPoint {
  name: string; // Room type name (e.g., "SUITE", "DOUBLE")
  value: number; // Number of bookings for this room type
  fill?: string; // For Pie chart cell color
}

// Helper to format currency
const formatCurrency = (value: number | null | undefined, currency = "MAD") => {
  if (value === null || value === undefined) return "N/A";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(value);
  } catch (e) {
    console.warn(
      `Invalid currency code used in formatCurrency: ${currency}. Falling back.`
    );
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
};

// Helper to format numbers (for counts)
const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "N/A";
  return new Intl.NumberFormat("en-US").format(value);
};

const AdminReportsPage = () => {
  const [bookingSummary, setBookingSummary] =
    useState<BookingStatsSummary | null>(null);
  const [revenueOverTimeData, setRevenueOverTimeData] = useState<
    TimeSeriesDataPoint[]
  >([]);
  const [bookingsOverTimeData, setBookingsOverTimeData] = useState<
    TimeSeriesDataPoint[]
  >([]);
  const [roomTypeDistributionData, setRoomTypeDistributionData] = useState<
    RoomTypeDistributionDataPoint[]
  >([]);

  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isLoadingRoomTypes, setIsLoadingRoomTypes] = useState(true);

  const [pageError, setPageError] = useState<string | null>(null); // A general error for the page

  // Date range state for filtering (optional, for future enhancement)
  // const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const fetchData = useCallback(
    async (
      reportType: string,
      setter: React.Dispatch<React.SetStateAction<any>>, // Be more specific if possible
      loadingSetter: React.Dispatch<React.SetStateAction<boolean>>
      // dateRangeParam?: DateRange // For future date filtering
    ) => {
      loadingSetter(true);
      // setPageError(null); // Clear general page error before new fetch
      let url = `/api/admin/reports?type=${reportType}`;
      // if (dateRangeParam?.from && dateRangeParam?.to) {
      //     url += `&startDate=${dateRangeParam.from.toISOString()}&endDate=${dateRangeParam.to.toISOString()}`;
      // }
      try {
        const res = await fetch(url);
        if (!res.ok) {
          const errData = await res
            .json()
            .catch(() => ({ message: `Failed to fetch ${reportType}` }));
          throw new Error(
            errData.message || `Failed to fetch ${reportType} data.`
          );
        }
        const data = await res.json();
        // API returns {data: []} for time series, and direct object for summary or array for distribution
        if (reportType === "bookingSummary") {
          setter(data);
        } else if (reportType === "roomTypeDistribution") {
          setter(data); // Expects direct array
        } else {
          // For revenueOverTime and bookingsOverTime
          setter(data.data || []);
        }
      } catch (e: any) {
        console.error(`Error loading ${reportType}:`, e);
        toast.error(`Error loading ${reportType}: ${e.message}`);
        // setPageError(`Could not load ${reportType}: ${e.message}`); // Optionally set a general page error
        setter(
          reportType.includes("OverTime") ||
            reportType === "roomTypeDistribution"
            ? []
            : null
        ); // Reset data on error
      } finally {
        loadingSetter(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchData("bookingSummary", setBookingSummary, setIsLoadingSummary);
    fetchData("revenueOverTime", setRevenueOverTimeData, setIsLoadingRevenue);
    fetchData(
      "bookingsOverTime",
      setBookingsOverTimeData,
      setIsLoadingBookings
    );
    fetchData(
      "roomTypeDistribution",
      setRoomTypeDistributionData,
      setIsLoadingRoomTypes
    );
  }, [fetchData]); // fetchData is memoized

  const RECHARTS_COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff8042",
    "#00C49F",
    "#FFBB28",
    "#FF739A",
    "#A2D2FF",
  ];

  const [activeIndexPie, setActiveIndexPie] = useState(0);
  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndexPie(index);
  }, []);

  const renderActiveShapeForPie = (props: any) => {
    const RADIAN = Math.PI / 180;
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      percent,
      value,
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 6) * cos; // Slightly increased distance for line start
    const sy = cy + (outerRadius + 6) * sin;
    const mx = cx + (outerRadius + 18) * cos; // Increased distance for line middle
    const my = cy + (outerRadius + 18) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 15; // Increased distance for text
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";

    return (
      <g>
        <text
          x={cx}
          y={cy}
          dy={8}
          textAnchor="middle"
          fill="#FFF"
          fontWeight="bold"
          fontSize={14}
        >
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="#374151"
          strokeWidth={1}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 3}
          outerRadius={outerRadius + 5}
          fill={fill}
        />{" "}
        {/* Accent ring */}
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
          stroke={fill}
          fill="none"
        />
        <circle cx={ex} cy={ey} r={3} fill={fill} stroke="none" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 8}
          y={ey}
          textAnchor={textAnchor}
          fill="#D1D5DB"
          fontSize={12}
        >{`${value} Bookings`}</text>
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 8}
          y={ey}
          dy={14}
          textAnchor={textAnchor}
          fill="#9CA3AF"
          fontSize={10}
        >{`(${(percent * 100).toFixed(1)}%)`}</text>
      </g>
    );
  };

  const isAnythingLoading =
    isLoadingSummary ||
    isLoadingRevenue ||
    isLoadingBookings ||
    isLoadingRoomTypes;
  const initialLoad =
    isAnythingLoading &&
    !bookingSummary &&
    !revenueOverTimeData.length &&
    !bookingsOverTimeData.length &&
    !roomTypeDistributionData.length;

  if (initialLoad) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-10rem)] text-center p-4">
        <Loader2 className="w-12 h-12 animate-spin text-purple-400 mb-4" />
        <p className="text-xl text-slate-300">Loading Analytics Dashboard...</p>
        <p className="text-sm text-slate-500">
          Crunching the latest numbers for you.
        </p>
      </div>
    );
  }

  if (pageError && !isAnythingLoading) {
    // Show general page error if all loading finished and error persists
    return (
      <div className="p-6 bg-red-900/20 text-red-300 rounded-lg border border-red-700 text-center">
        {pageError}{" "}
        <button
          onClick={() => {
            fetchData("bookingSummary", setBookingSummary, setIsLoadingSummary);
            fetchData(
              "revenueOverTime",
              setRevenueOverTimeData,
              setIsLoadingRevenue
            );
            fetchData(
              "bookingsOverTime",
              setBookingsOverTimeData,
              setIsLoadingBookings
            );
            fetchData(
              "roomTypeDistribution",
              setRoomTypeDistributionData,
              setIsLoadingRoomTypes
            );
          }}
          className="ml-2 text-purple-300 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-2">
        <div className="flex items-center gap-3">
          <BarChart3 size={30} className="text-purple-400" />
          <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
        </div>
        {/* Placeholder for Date Range Picker */}
        {/* <DateRangePicker onUpdate={(values) => setDateRange(values.range)} /> */}
      </div>
      <p className="text-slate-400 -mt-6 mb-8">
        Key performance indicators and operational insights.
      </p>

      {/* Booking Stats Summary Section */}
      <section>
        <h2 className="text-xl font-semibold text-purple-300 mb-4">
          Overall Performance
        </h2>
        {isLoadingSummary && !bookingSummary ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(6)].map((_, i) => (
              <Card
                key={i}
                className="bg-slate-800/70 border-slate-700 h-32 animate-pulse"
              ></Card>
            ))}
          </div>
        ) : (
          bookingSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              <Card className="bg-slate-800/70 border-slate-700 text-white hover:border-purple-500/70 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">
                    Total Reservations
                  </CardTitle>
                  <BookOpen className="h-5 w-5 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatNumber(bookingSummary.totalReservations)}
                  </div>
                  <p className="text-xs text-slate-500">Confirmed/Completed</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/70 border-slate-700 text-white hover:border-green-500/70 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">
                    Total Revenue
                  </CardTitle>
                  <DollarSign className="h-5 w-5 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatCurrency(bookingSummary.totalRevenue)}
                  </div>
                  <p className="text-xs text-slate-500">All Time</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/70 border-slate-700 text-white hover:border-pink-500/70 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">
                    Revenue (This Month)
                  </CardTitle>
                  <TrendingUp className="h-5 w-5 text-pink-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatCurrency(bookingSummary.revenueThisMonth)}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/70 border-slate-700 text-white hover:border-teal-500/70 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">
                    Avg. Booking Value
                  </CardTitle>
                  <DollarSign className="h-5 w-5 text-teal-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatCurrency(bookingSummary.averageBookingValue)}
                  </div>
                  <p className="text-xs text-slate-500">Per Booking</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/70 border-slate-700 text-white hover:border-sky-500/70 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">
                    Unique Clients
                  </CardTitle>
                  <Users className="h-5 w-5 text-sky-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatNumber(bookingSummary.uniqueClients)}
                  </div>
                  <p className="text-xs text-slate-500">Active Reservations</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/70 border-slate-700 text-white hover:border-indigo-500/70 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">
                    Bookings (This Month)
                  </CardTitle>
                  <CalendarCheck className="h-5 w-5 text-indigo-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatNumber(bookingSummary.reservationsThisMonth)}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/70 border-slate-700 text-white hover:border-blue-500/70 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">
                    Total Feedbacks
                  </CardTitle>
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatNumber(bookingSummary.totalFeedbacks)}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/70 border-slate-700 text-white hover:border-yellow-500/70 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">
                    Avg. Rating
                  </CardTitle>
                  <Star className="h-5 w-5 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {bookingSummary.averageFeedbackRating?.toFixed(1) || "N/A"}{" "}
                    / 5
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        )}
      </section>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        <Card className="bg-slate-800/70 border-slate-700 text-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-purple-300 flex items-center gap-2">
              <LineChartIcon size={20} />
              Revenue Trend
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Monthly revenue (default last 12 months)
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            {isLoadingRevenue ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : revenueOverTimeData.length > 0 ? (
              <ResponsiveContainer>
                <LineChart
                  data={revenueOverTimeData}
                  margin={{ top: 5, right: 20, left: -15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) =>
                      formatCurrency(value, "MAD").split(".")[0]
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A202C",
                      border: "1px solid #2D3748",
                      borderRadius: "0.375rem",
                    }}
                    labelStyle={{ color: "#E2E8F0" }}
                    itemStyle={{ color: "#9F7AEA" }}
                    formatter={(value: number) => [
                      formatCurrency(value, "MAD"),
                      "Revenue",
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Revenue"
                    stroke="#9F7AEA"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#9F7AEA" }}
                    activeDot={{ r: 5, strokeWidth: 1, stroke: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">
                No revenue data.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/70 border-slate-700 text-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-purple-300 flex items-center gap-2">
              <BarChart3 size={20} />
              Booking Volume
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Monthly booking counts (default last 12 months)
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            {isLoadingBookings ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : bookingsOverTimeData.length > 0 ? (
              <ResponsiveContainer>
                <BarChart
                  data={bookingsOverTimeData}
                  margin={{ top: 5, right: 20, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    tick={{ fontSize: 10 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A202C",
                      border: "1px solid #2D3748",
                      borderRadius: "0.375rem",
                    }}
                    labelStyle={{ color: "#E2E8F0" }}
                    itemStyle={{ color: "#63B3ED" }}
                    formatter={(value: number) => [value, "Bookings"]}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar
                    dataKey="value"
                    name="Bookings"
                    fill="#63B3ED"
                    barSize={20}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">
                No booking volume data.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="mt-10">
        <Card className="bg-slate-800/70 border-slate-700 text-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-purple-300 flex items-center gap-2">
              <PieChartIcon size={20} />
              Bookings by Room Type
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Distribution of all active bookings.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] sm:h-[400px] w-full flex items-center justify-center">
            {" "}
            {/* Centering pie chart */}
            {isLoadingRoomTypes ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : roomTypeDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndexPie}
                    activeShape={renderActiveShapeForPie}
                    data={roomTypeDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={window.innerWidth < 640 ? 60 : 80} // Responsive radius
                    outerRadius={window.innerWidth < 640 ? 80 : 110}
                    dataKey="value"
                    nameKey="name"
                    onMouseEnter={onPieEnter}
                    paddingAngle={2}
                  >
                    {roomTypeDistributionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={RECHARTS_COLORS[index % RECHARTS_COLORS.length]}
                        stroke="#374151"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} bookings`,
                      name,
                    ]}
                  />
                  <Legend
                    layout="radial"
                    align="center"
                    verticalAlign="bottom"
                    iconSize={10}
                    wrapperStyle={{ fontSize: "11px", marginTop: "10px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">
                No room type distribution data.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default AdminReportsPage;
