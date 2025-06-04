// File: src/controllers/admin/analyticsController.js

const { User, Booking, Service, Payment, sequelize } = require('../../models');
const { Op, fn, col, literal } = require('sequelize');

// Get user growth metrics
exports.getUserGrowthMetrics = async (req, res) => {
  try {
    const { startDate, endDate, interval = 'day' } = req.query;
    
    // Parse dates
    const start = new Date(startDate || new Date().setDate(new Date().getDate() - 30));
    const end = new Date(endDate || new Date());
    
    // Determine grouping format based on interval
    let dateFormat, dateGrouping;
    
    switch (interval) {
      case 'month':
        dateFormat = 'YYYY-MM';
        dateGrouping = literal(`DATE_TRUNC('month', "createdAt")`);
        break;
      case 'week':
        dateFormat = 'YYYY-WW';
        dateGrouping = literal(`DATE_TRUNC('week', "createdAt")`);
        break;
      case 'day':
      default:
        dateFormat = 'YYYY-MM-DD';
        dateGrouping = literal(`DATE_TRUNC('day', "createdAt")`);
    }
    
    // User growth aggregation
    const userGrowth = await User.findAll({
      attributes: [
        [dateGrouping, 'date'],
        [fn('COUNT', col('id')), 'newUsers'],
        [fn('COUNT', literal(`CASE WHEN role = 'customer' THEN 1 ELSE NULL END`)), 'newCustomers'],
        [fn('COUNT', literal(`CASE WHEN role = 'provider' THEN 1 ELSE NULL END`)), 'newProviders']
      ],
      where: {
        createdAt: { [Op.between]: [start, end] }
      },
      group: ['date'],
      order: [[col('date'), 'ASC']]
    });
    
    // User status distribution
    const statusDistribution = await User.findAll({
      attributes: [
        ['status', 'status'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status']
    });
    
    // Calculate retention (users active in last 30 days vs total)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const totalUsers = await User.count();
    const activeUsers = await User.count({
      where: {
        lastLogin: { [Op.gte]: thirtyDaysAgo }
      }
    });
    
    const retentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
    
    return res.status(200).json({
      userGrowth,
      statusDistribution,
      retention: {
        totalUsers,
        activeUsers,
        retentionRate
      }
    });
  } catch (error) {
    console.error('Error fetching user growth metrics:', error);
    return res.status(500).json({ message: 'Failed to fetch user growth metrics', error: error.message });
  }
};

// Get service usage metrics
exports.getServiceUsageMetrics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Parse dates
    const start = new Date(startDate || new Date().setDate(new Date().getDate() - 30));
    const end = new Date(endDate || new Date());
    
    // Service bookings over time
    const bookingsOverTime = await Booking.findAll({
      attributes: [
        [literal(`DATE_TRUNC('day', "createdAt")`), 'date'],
        [fn('COUNT', col('id')), 'bookings']
      ],
      where: {
        createdAt: { [Op.between]: [start, end] }
      },
      group: ['date'],
      order: [[col('date'), 'ASC']]
    });
    
    // Booking status distribution
    const bookingStatus = await Booking.findAll({
      attributes: [
        ['status', 'status'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        createdAt: { [Op.between]: [start, end] }
      },
      group: ['status']
    });
    
    // Average bookings per user
    const avgBookingsPerUser = await Booking.findAll({
      attributes: [
        ['userId', 'userId'],
        [fn('COUNT', col('id')), 'bookingCount']
      ],
      where: {
        createdAt: { [Op.between]: [start, end] }
      },
      group: ['userId']
    });
    
    const userCount = avgBookingsPerUser.length;
    const totalBookings = avgBookingsPerUser.reduce((sum, item) => sum + parseInt(item.get('bookingCount')), 0);
    const maxBookings = userCount > 0 ? Math.max(...avgBookingsPerUser.map(item => parseInt(item.get('bookingCount')))) : 0;
    const averageBookings = userCount > 0 ? totalBookings / userCount : 0;
    
    return res.status(200).json({
      bookingsOverTime,
      bookingStatus,
      userEngagement: {
        averageBookings,
        maxBookings,
        userCount
      }
    });
  } catch (error) {
    console.error('Error fetching service usage metrics:', error);
    return res.status(500).json({ message: 'Failed to fetch service usage metrics', error: error.message });
  }
};

// Get financial metrics
exports.getFinancialMetrics = async (req, res) => {
  try {
    const { startDate, endDate, interval = 'day' } = req.query;
    
    // Parse dates
    const start = new Date(startDate || new Date().setDate(new Date().getDate() - 30));
    const end = new Date(endDate || new Date());
    
    // Determine grouping format based on interval
    let dateGrouping;
    
    switch (interval) {
      case 'month':
        dateGrouping = literal(`DATE_TRUNC('month', "createdAt")`);
        break;
      case 'week':
        dateGrouping = literal(`DATE_TRUNC('week', "createdAt")`);
        break;
      case 'day':
      default:
        dateGrouping = literal(`DATE_TRUNC('day', "createdAt")`);
    }
    
    // Revenue over time
    const revenueOverTime = await Payment.findAll({
      attributes: [
        [dateGrouping, 'date'],
        [fn('SUM', col('amount')), 'revenue'],
        [fn('SUM', col('platformFee')), 'fees'],
        [fn('COUNT', col('id')), 'transactions']
      ],
      where: {
        paymentStatus: 'completed',
        createdAt: { [Op.between]: [start, end] }
      },
      group: ['date'],
      order: [[col('date'), 'ASC']]
    });
    
    // Payment method distribution
    const paymentMethods = await Payment.findAll({
      attributes: [
        ['paymentMethod', 'paymentMethod'],
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('amount')), 'revenue']
      ],
      where: {
        paymentStatus: 'completed',
        createdAt: { [Op.between]: [start, end] }
      },
      group: ['paymentMethod']
    });
    
    // Total financial summary
    const financialSummary = await Payment.findAll({
      attributes: [
        ['paymentStatus', 'paymentStatus'],
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('amount')), 'amount'],
        [fn('SUM', col('platformFee')), 'fees']
      ],
      where: {
        createdAt: { [Op.between]: [start, end] }
      },
      group: ['paymentStatus']
    });
    
    // Average transaction value
    const summaryData = await Payment.findAll({
      attributes: [
        [fn('AVG', col('amount')), 'avgTransactionValue'],
        [fn('SUM', col('amount')), 'totalRevenue'],
        [fn('SUM', col('platformFee')), 'totalFees'],
        [fn('COUNT', col('id')), 'transactionCount']
      ],
      where: {
        paymentStatus: 'completed',
        createdAt: { [Op.between]: [start, end] }
      }
    });
    
    const summary = summaryData[0] || { 
      avgTransactionValue: 0, 
      totalRevenue: 0,
      totalFees: 0,
      transactionCount: 0
    };
    
    return res.status(200).json({
      revenueOverTime,
      paymentMethods,
      financialSummary,
      summary
    });
  } catch (error) {
    console.error('Error fetching financial metrics:', error);
    return res.status(500).json({ message: 'Failed to fetch financial metrics', error: error.message });
  }
};

// Get popular services
exports.getPopularServices = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    
    // Parse dates
    const start = new Date(startDate || new Date().setDate(new Date().getDate() - 30));
    const end = new Date(endDate || new Date());
    
    // Most booked services
    const popularServices = await Booking.findAll({
      attributes: [
        ['serviceId', 'serviceId'],
        [fn('COUNT', col('id')), 'bookingCount'],
        [fn('SUM', col('price')), 'revenue']
      ],
      where: {
        createdAt: { [Op.between]: [start, end] }
      },
      include: [
        {
          model: Service,
          as: 'service',
          attributes: ['name', 'providerId'],
          include: [
            {
              model: User,
              as: 'provider',
              attributes: ['firstName', 'lastName']
            }
          ]
        }
      ],
      group: ['serviceId', 'service.id', 'service.provider.id'],
      order: [[col('bookingCount'), 'DESC']],
      limit: parseInt(limit)
    });
    
    // Service categories distribution
    const categoryDistribution = await Service.findAll({
      attributes: [
        ['serviceCategoryId', 'categoryId'],
        [fn('COUNT', col('id')), 'serviceCount']
      ],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['name']
        }
      ],
      group: ['serviceCategoryId', 'category.id'],
      order: [[col('serviceCount'), 'DESC']]
    });
    
    // Top providers
    const topProviders = await Booking.findAll({
      attributes: [
        ['providerId', 'providerId'],
        [fn('COUNT', col('id')), 'bookingCount'],
        [fn('SUM', col('price')), 'revenue']
      ],
      where: {
        createdAt: { [Op.between]: [start, end] }
      },
      include: [
        {
          model: ServiceProviderProfile,
          as: 'provider',
          attributes: ['businessName'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName', 'email']
            }
          ]
        }
      ],
      group: ['providerId', 'provider.id', 'provider.user.id'],
      order: [[col('bookingCount'), 'DESC']],
      limit: parseInt(limit)
    });
    
    return res.status(200).json({
      popularServices,
      categoryDistribution,
      topProviders
    });
  } catch (error) {
    console.error('Error fetching popular services:', error);
    return res.status(500).json({ message: 'Failed to fetch popular services', error: error.message });
  }
};

// Get system health metrics
exports.getSystemHealth = async (req, res) => {
  try {
    // For Sequelize/PostgreSQL, we can't directly get database stats like MongoDB
    // Instead, we'll use PostgreSQL-specific queries
    
    const dbStats = await sequelize.query(`
      SELECT
        (SELECT count(*) FROM pg_stat_activity) AS active_connections,
        pg_database_size(current_database()) AS database_size,
        (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') AS table_count
    `, { type: sequelize.QueryTypes.SELECT });
    
    // API response times (would be fetched from monitoring service in production)
    // This is mock data for demonstration
    const apiPerformance = {
      averageResponseTime: 120, // ms
      p95ResponseTime: 350, // ms
      p99ResponseTime: 500, // ms
      requestsPerMinute: 350,
      errorRate: 0.5 // percentage
    };
    
    // Recent errors (would be fetched from error logging service)
    // Mock data for demonstration
    const recentErrors = [
      {
        timestamp: new Date(Date.now() - 3600000),
        endpoint: '/api/booking',
        errorCode: 500,
        message: 'Database connection timeout',
        count: 3
      },
      {
        timestamp: new Date(Date.now() - 7200000),
        endpoint: '/api/payments/process',
        errorCode: 502,
        message: 'Payment gateway unavailable',
        count: 2
      }
    ];
    
    return res.status(200).json({
      database: dbStats[0],
      apiPerformance,
      recentErrors,
      serverTime: new Date()
    });
  } catch (error) {
    console.error('Error fetching system health metrics:', error);
    return res.status(500).json({ message: 'Failed to fetch system health metrics', error: error.message });
  }
};