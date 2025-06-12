import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, Calendar, Download, RefreshCw, Activity } from 'lucide-react';
import '../../styles/AnalyticsPanel.css';

const AnalyticsPanel = () => {
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalRevenue: 0,
      revenueGrowth: 0,
      totalBookings: 0,
      bookingGrowth: 0,
      totalUsers: 0,
      userGrowth: 0,
      conversionRate: 0,
      conversionGrowth: 0
    },
    userGrowth: [],
    bookingTrends: [],
    revenueData: [],
    topServices: [],
    topProviders: [],
    systemHealth: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState([]);
  const [timeFrame, setTimeFrame] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Chart refs
  const revenueChartRef = useRef(null);
  const userGrowthChartRef = useRef(null);
  const topServicesChartRef = useRef(null);
  const bookingTrendsChartRef = useRef(null);

  const API_BASE = 'http://localhost:5000';

  // Add debug logging function
  const addDebugInfo = (message, data = null) => {
    const debugEntry = {
      timestamp: new Date().toISOString(),
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    };
    setDebugInfo(prev => [...prev, debugEntry]);
    console.log('Debug:', message, data);
  };

  // Calculate date range based on timeFrame
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeFrame));
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setDebugInfo([]);
      
      const token = 'mock-token'; // Since we can't use localStorage
      const { startDate, endDate } = getDateRange();
      
      addDebugInfo('Starting analytics fetch', { startDate, endDate, timeFrame });
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      addDebugInfo('Making API requests with headers', { headers: { ...headers, Authorization: 'Bearer [HIDDEN]' } });

      // For demo purposes, we'll use mock data since we can't make real API calls
      const processedData = {
        overview: {
          totalRevenue: 15420.50,
          revenueGrowth: 12.5,
          totalBookings: 145,
          bookingGrowth: 8.3,
          totalUsers: 289,
          userGrowth: 15.2,
          conversionRate: 4.2,
          conversionGrowth: 2.1
        },
        userGrowth: generateMockUserGrowthData(),
        bookingTrends: generateMockBookingData(),
        revenueData: generateMockRevenueData(),
        topServices: generateMockTopServices(),
        topProviders: generateMockTopProviders(),
        systemHealth: {
          cpuUsage: 45,
          memoryUsage: 62,
          databaseStatus: 'healthy',
          activeConnections: 23,
          uptime: 86400,
          lastBackup: new Date(Date.now() - 86400000)
        }
      };

      addDebugInfo('Processed analytics data', processedData);
      setAnalyticsData(processedData);
      setError(null);
      
    } catch (err) {
      console.error('Error fetching analytics:', err);
      addDebugInfo('Fetch error', { message: err.message, stack: err.stack });
      setError(`Failed to load analytics data: ${err.message}`);
      
      // Set mock data on error
      setAnalyticsData({
        overview: {
          totalRevenue: 15420.50,
          revenueGrowth: 12.5,
          totalBookings: 145,
          bookingGrowth: 8.3,
          totalUsers: 289,
          userGrowth: 15.2,
          conversionRate: 4.2,
          conversionGrowth: 2.1
        },
        userGrowth: generateMockUserGrowthData(),
        bookingTrends: generateMockBookingData(),
        revenueData: generateMockRevenueData(),
        topServices: generateMockTopServices(),
        topProviders: generateMockTopProviders(),
        systemHealth: {
          cpuUsage: 45,
          memoryUsage: 62,
          databaseStatus: 'healthy',
          activeConnections: 23
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, [timeFrame]);

  // Mock data generators
  const generateMockUserGrowthData = () => {
    const data = [];
    const today = new Date();
    for (let i = parseInt(timeFrame) - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        newUsers: Math.floor(Math.random() * 20) + 5,
        newCustomers: Math.floor(Math.random() * 15) + 3,
        newProviders: Math.floor(Math.random() * 5) + 1
      });
    }
    return data;
  };

  const generateMockBookingData = () => {
    const data = [];
    const today = new Date();
    for (let i = parseInt(timeFrame) - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        bookings: Math.floor(Math.random() * 15) + 3,
        completed: Math.floor(Math.random() * 10) + 2,
        cancelled: Math.floor(Math.random() * 3) + 1
      });
    }
    return data;
  };

  const generateMockRevenueData = () => {
    const data = [];
    const today = new Date();
    for (let i = parseInt(timeFrame) - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 2000) + 500,
        fees: Math.floor(Math.random() * 200) + 50,
        transactions: Math.floor(Math.random() * 20) + 5
      });
    }
    return data;
  };

  const generateMockTopServices = () => {
    return [
      { id: 1, name: 'House Cleaning', category: 'Cleaning', bookings: 45, revenue: 2250, bookingCount: 45, totalRevenue: 2250 },
      { id: 2, name: 'Plumbing', category: 'Home Repair', bookings: 32, revenue: 1920, bookingCount: 32, totalRevenue: 1920 },
      { id: 3, name: 'Gardening', category: 'Outdoor', bookings: 28, revenue: 1400, bookingCount: 28, totalRevenue: 1400 },
      { id: 4, name: 'Electrical Work', category: 'Home Repair', bookings: 25, revenue: 1875, bookingCount: 25, totalRevenue: 1875 },
      { id: 5, name: 'Pet Sitting', category: 'Pet Care', bookings: 22, revenue: 880, bookingCount: 22, totalRevenue: 880 }
    ];
  };

  const generateMockTopProviders = () => {
    return [
      { id: 1, name: 'John Smith', services: 'Cleaning', bookings: 23, rating: 4.8, revenue: 1150 },
      { id: 2, name: 'Sarah Johnson', services: 'Plumbing', bookings: 18, rating: 4.9, revenue: 1080 },
      { id: 3, name: 'Mike Wilson', services: 'Gardening', bookings: 15, rating: 4.7, revenue: 750 },
      { id: 4, name: 'Lisa Brown', services: 'Pet Care', bookings: 12, rating: 4.6, revenue: 480 },
      { id: 5, name: 'David Miller', services: 'Electrical', bookings: 10, rating: 4.8, revenue: 750 }
    ];
  };

  // Export functionality
  const exportData = (format) => {
    const data = analyticsData;
    
    if (format === 'csv') {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Date,Revenue,Bookings,New Users\n";
      
      data.revenueData.forEach(item => {
        const row = `${item.date},${item.revenue},${item.transactions},${data.userGrowth.find(u => u.date === item.date)?.newUsers || 0}`;
        csvContent += row + "\n";
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `analytics-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Chart colors
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value) => {
    const isPositive = value >= 0;
    return (
      <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor your platform's performance and growth</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            
            <button
              onClick={() => exportData('csv')}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
            
            <button
              onClick={fetchAnalyticsData}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-medium">Error loading analytics data</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.overview.totalRevenue)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              {formatPercentage(analyticsData.overview.revenueGrowth)}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalBookings}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              {formatPercentage(analyticsData.overview.bookingGrowth)}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalUsers}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              {formatPercentage(analyticsData.overview.userGrowth)}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.conversionRate.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              {formatPercentage(analyticsData.overview.conversionGrowth)}
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.revenueData} ref={revenueChartRef}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Revenue"
                />
                <Line 
                  type="monotone" 
                  dataKey="fees" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Platform Fees"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* User Growth Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.userGrowth} ref={userGrowthChartRef}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="newUsers" fill="#8884d8" name="New Users" />
                <Bar dataKey="newCustomers" fill="#82ca9d" name="New Customers" />
                <Bar dataKey="newProviders" fill="#ffc658" name="New Providers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Trends and Top Services */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Booking Trends */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.bookingTrends} ref={bookingTrendsChartRef}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="bookings" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Total Bookings"
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Completed"
                />
                <Line 
                  type="monotone" 
                  dataKey="cancelled" 
                  stroke="#ff7300" 
                  strokeWidth={2}
                  name="Cancelled"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Services Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Services by Bookings</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart ref={topServicesChartRef}>
                <Pie
                  data={analyticsData.topServices}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="bookings"
                >
                  {analyticsData.topServices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Services and Providers Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Services Table */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Services</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bookings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.topServices.map((service, index) => (
                    <tr key={service.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{service.name}</div>
                        <div className="text-sm text-gray-500">{service.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {service.bookings}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(service.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Providers Table */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Providers</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bookings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.topProviders.map((provider, index) => (
                    <tr key={provider.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                        <div className="text-sm text-gray-500">{provider.services}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {provider.bookings}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ⭐ {provider.rating}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(provider.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analyticsData.systemHealth.cpuUsage}%</div>
              <div className="text-sm text-gray-600">CPU Usage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analyticsData.systemHealth.memoryUsage}%</div>
              <div className="text-sm text-gray-600">Memory Usage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analyticsData.systemHealth.activeConnections}</div>
              <div className="text-sm text-gray-600">Active Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Healthy</div>
              <div className="text-sm text-gray-600">Database Status</div>
            </div>
          </div>
        </div>

  
      </div>
    </div>
  );
};

export default AnalyticsPanel;