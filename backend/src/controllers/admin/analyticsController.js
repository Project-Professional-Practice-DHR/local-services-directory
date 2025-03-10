// File: src/controllers/admin/analyticsController.js

const User = require('../../models/User');
const Booking = require('../../models/Booking');
const Service = require('../../models/Service');
const Payment = require('../../models/Payment');
const mongoose = require('sequelize');

// Get user growth metrics
exports.getUserGrowthMetrics = async (req, res) => {
  try {
    const { startDate, endDate, interval = 'day' } = req.query;
    
    // Parse dates
    const start = new Date(startDate || new Date().setDate(new Date().getDate() - 30));
    const end = new Date(endDate || new Date());
    
    // Determine grouping format based on interval
    let dateFormat;
    let groupBy;
    
    switch (interval) {
      case 'month':
        dateFormat = '%Y-%m';
        groupBy = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
        break;
      case 'week':
        dateFormat = '%Y-W%U';
        groupBy = { 
          year: { $year: '$createdAt' }, 
          week: { $week: '$createdAt' } 
        };
        break;
      case 'day':
      default:
        dateFormat = '%Y-%m-%d';
        groupBy = { 
          year: { $year: '$createdAt' }, 
          month: { $month: '$createdAt' }, 
          day: { $dayOfMonth: '$createdAt' } 
        };
    }
    
    // User growth aggregation
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: groupBy,
          newUsers: { $sum: 1 },
          byRole: {
            $push: '$role'
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 }
      },
      {
        $project: {
          date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          newUsers: 1,
          newCustomers: {
            $size: {
              $filter: {
                input: '$byRole',
                as: 'role',
                cond: { $eq: ['$$role', 'user'] }
              }
            }
          },
          newProviders: {
            $size: {
              $filter: {
                input: '$byRole',
                as: 'role',
                cond: { $eq: ['$$role', 'provider'] }
              }
            }
          }
        }
      }
    ]);
    
    // User status distribution
    const statusDistribution = await User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Calculate retention (users active in last 30 days vs total)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const retention = await User.aggregate([
      {
        $facet: {
          'total': [
            { $count: 'count' }
          ],
          'active': [
            {
              $match: {
                lastLoginAt: { $gte: thirtyDaysAgo }
              }
            },
            { $count: 'count' }
          ]
        }
      },
      {
        $project: {
          totalUsers: { $arrayElemAt: ['$total.count', 0] },
          activeUsers: { $arrayElemAt: ['$active.count', 0] },
          retentionRate: {
            $multiply: [
              {
                $divide: [
                  { $arrayElemAt: ['$active.count', 0] },
                  { $arrayElemAt: ['$total.count', 0] }
                ]
              },
              100
            ]
          }
        }
      }
    ]);
    
    return res.status(200).json({
      userGrowth,
      statusDistribution,
      retention: retention[0]
    });
  } catch (error) {
    console.error('Error fetching user growth metrics:', error);
    return res.status(500).json({ message: 'Failed to fetch user growth metrics' });
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
    const bookingsOverTime = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          bookings: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      },
      {
        $project: {
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day'
                }
              }
            }
          },
          bookings: 1,
          _id: 0
        }
      }
    ]);
    
    // Booking status distribution
    const bookingStatus = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Average bookings per user
    const avgBookingsPerUser = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$userId',
          bookingCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          averageBookings: { $avg: '$bookingCount' },
          maxBookings: { $max: '$bookingCount' },
          userCount: { $sum: 1 }
        }
      }
    ]);
    
    return res.status(200).json({
      bookingsOverTime,
      bookingStatus,
      userEngagement: avgBookingsPerUser[0] || { averageBookings: 0, maxBookings: 0, userCount: 0 }
    });
  } catch (error) {
    console.error('Error fetching service usage metrics:', error);
    return res.status(500).json({ message: 'Failed to fetch service usage metrics' });
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
    let dateFormat;
    let groupBy;
    
    switch (interval) {
      case 'month':
        dateFormat = '%Y-%m';
        groupBy = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
        break;
      case 'week':
        dateFormat = '%Y-W%U';
        groupBy = { 
          year: { $year: '$createdAt' }, 
          week: { $week: '$createdAt' } 
        };
        break;
      case 'day':
      default:
        dateFormat = '%Y-%m-%d';
        groupBy = { 
          year: { $year: '$createdAt' }, 
          month: { $month: '$createdAt' }, 
          day: { $dayOfMonth: '$createdAt' } 
        };
    }
    
    // Revenue over time
    const revenueOverTime = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$amount' },
          fees: { $sum: '$platformFee' },
          transactions: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 }
      },
      {
        $project: {
          date: {
            $dateToString: {
              format: dateFormat,
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: { $ifNull: ['$_id.day', 1] }
                }
              }
            }
          },
          revenue: 1,
          fees: 1,
          transactions: 1,
          _id: 0
        }
      }
    ]);
    
    // Payment method distribution
    const paymentMethods = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      }
    ]);
    
    // Total financial summary
    const financialSummary = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
          fees: { $sum: '$platformFee' }
        }
      }
    ]);
    
    // Average transaction value
    const averageValues = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          avgTransactionValue: { $avg: '$amount' },
          totalRevenue: { $sum: '$amount' },
          totalFees: { $sum: '$platformFee' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);
    
    return res.status(200).json({
      revenueOverTime,
      paymentMethods,
      financialSummary,
      summary: averageValues[0] || { 
        avgTransactionValue: 0, 
        totalRevenue: 0,
        totalFees: 0,
        transactionCount: 0
      }
    });
  } catch (error) {
    console.error('Error fetching financial metrics:', error);
    return res.status(500).json({ message: 'Failed to fetch financial metrics' });
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
    const popularServices = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$serviceId',
          bookingCount: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      },
      {
        $sort: { bookingCount: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'serviceDetails'
        }
      },
      {
        $unwind: '$serviceDetails'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'serviceDetails.providerId',
          foreignField: '_id',
          as: 'providerDetails'
        }
      },
      {
        $unwind: '$providerDetails'
      },
      {
        $project: {
          serviceName: '$serviceDetails.name',
          serviceCategory: '$serviceDetails.category',
          providerName: '$providerDetails.name',
          providerId: '$serviceDetails.providerId',
          bookingCount: 1,
          revenue: 1,
          averagePrice: { $divide: ['$revenue', '$bookingCount'] }
        }
      }
    ]);
    
    // Service categories distribution
    const categoryDistribution = await Service.aggregate([
      {
        $group: {
          _id: '$category',
          serviceCount: { $sum: 1 }
        }
      },
      {
        $sort: { serviceCount: -1 }
      }
    ]);
    
    // Top providers
    const topProviders = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: 'serviceId',
          foreignField: '_id',
          as: 'service'
        }
      },
      {
        $unwind: '$service'
      },
      {
        $group: {
          _id: '$service.providerId',
          bookingCount: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      },
      {
        $sort: { bookingCount: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'providerDetails'
        }
      },
      {
        $unwind: '$providerDetails'
      },
      {
        $project: {
          providerName: '$providerDetails.name',
          providerEmail: '$providerDetails.email',
          bookingCount: 1,
          revenue: 1
        }
      }
    ]);
    
    return res.status(200).json({
      popularServices,
      categoryDistribution,
      topProviders
    });
  } catch (error) {
    console.error('Error fetching popular services:', error);
    return res.status(500).json({ message: 'Failed to fetch popular services' });
  }
};

// Get system health metrics (continued)
exports.getSystemHealth = async (req, res) => {
    try {
      // Current MongoDB stats
      const dbStatus = await mongoose.connection.db.stats();
      
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
          endpoint: '/api/bookings',
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
        database: {
          collections: dbStatus.collections,
          documents: dbStatus.objects,
          storageSize: dbStatus.storageSize,
          indexes: dbStatus.indexes,
          indexSize: dbStatus.indexSize
        },
        apiPerformance,
        recentErrors,
        serverTime: new Date()
      });
    } catch (error) {
      console.error('Error fetching system health metrics:', error);
      return res.status(500).json({ message: 'Failed to fetch system health metrics' });
    }
  };