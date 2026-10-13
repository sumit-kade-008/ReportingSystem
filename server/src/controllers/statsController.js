// server/src/controllers/statsController.js
// Handles analytics aggregations for Department and Admin dashboards.

const Report = require('../models/Report');

/**
 * @desc    Get KPI statistics for the logged-in Department
 * @route   GET /api/stats/department
 * @access  Protected (Department)
 */
const getDepartmentStats = async (req, res, next) => {
  try {
    const department = req.user.department;

    if (!department) {
      return res.status(403).json({ success: false, message: 'User has no assigned department' });
    }

    const [newCount, inProgressCount, resolvedCount, criticalCount, totalCount] = await Promise.all([
      Report.countDocuments({ department, status: 'Assigned' }),
      Report.countDocuments({ department, status: 'In Progress' }),
      Report.countDocuments({ department, status: 'Resolved' }),
      Report.countDocuments({ department, severity: 'Critical', status: { $ne: 'Resolved' } }),
      Report.countDocuments({ department }),
    ]);

    res.status(200).json({
      success: true,
      department,
      stats: {
        new: newCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        critical: criticalCount,
        total: totalCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get system-wide overview statistics for Admin Dashboard
 * @route   GET /api/stats/admin-overview
 * @access  Protected (Admin)
 */
const getAdminOverviewStats = async (req, res, next) => {
  try {
    const [total, pending, assigned, inProgress, resolved, critical] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'Pending' }),
      Report.countDocuments({ status: 'Assigned' }),
      Report.countDocuments({ status: 'In Progress' }),
      Report.countDocuments({ status: 'Resolved' }),
      Report.countDocuments({ severity: 'Critical', status: { $ne: 'Resolved' } }),
    ]);

    // Breakdown by category
    const categoryAgg = await Report.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Breakdown by severity
    const severityAgg = await Report.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        assigned,
        inProgress,
        resolved,
        critical,
        byCategory: categoryAgg,
        bySeverity: severityAgg,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get performance metrics per department (Resolution % & Average Resolution Time)
 * @route   GET /api/stats/department-performance
 * @access  Protected (Admin)
 */
const getDepartmentPerformanceStats = async (req, res, next) => {
  try {
    const departments = ['Road', 'Water', 'Electricity', 'Drainage', 'Tree', 'Fire', 'Sanitation'];

    const performance = await Promise.all(
      departments.map(async (dept) => {
        const total = await Report.countDocuments({ department: dept });
        const resolvedReports = await Report.find({
          department: dept,
          status: 'Resolved',
          resolvedAt: { $ne: null },
        }).select('createdAt resolvedAt');

        const resolvedCount = resolvedReports.length;
        const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

        // Calculate average resolution time in hours
        let avgResolutionHours = 0;
        if (resolvedReports.length > 0) {
          const totalMs = resolvedReports.reduce((acc, r) => {
            const diff = new Date(r.resolvedAt) - new Date(r.createdAt);
            return acc + Math.max(diff, 0);
          }, 0);
          avgResolutionHours = Number((totalMs / (resolvedReports.length * 1000 * 60 * 60)).toFixed(1));
        }

        return {
          department: dept,
          total,
          resolved: resolvedCount,
          active: total - resolvedCount,
          resolutionRate, // In %
          avgResolutionHours, // In hours
        };
      })
    );

    res.status(200).json({
      success: true,
      performance,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartmentStats,
  getAdminOverviewStats,
  getDepartmentPerformanceStats,
};
