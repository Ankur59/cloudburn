import asyncHandler from '../middlewares/async.middleware.js';
import { sendSuccess } from '../utils/responseHelper.js';
import ResourceSnapshot from '../models/resourceSnapshot.model.js';
import mongoose from 'mongoose';

/**
 * GET /api/analytics/resource-usage
 * Aggregates resource snapshot data to show average utilization and resource counts per service.
 */
export const getResourceUsageAnalytics = asyncHandler(async (req, res) => {
  const { orgId } = req.user;

  // Aggregate by service and metricName
  const analytics = await ResourceSnapshot.aggregate([
    { $match: { orgId: new mongoose.Types.ObjectId(orgId) } },
    {
      $group: {
        _id: { service: "$service", metricName: "$metricName" },
        avgValue: { $avg: "$value" },
        resourceCount: { $addToSet: "$resourceId" },
        lastUpdated: { $max: "$timestamp" }
      }
    },
    {
      $group: {
        _id: "$_id.service",
        metrics: {
          $push: {
            name: "$_id.metricName",
            value: { $round: ["$avgValue", 2] },
            count: { $size: "$resourceCount" }
          }
        },
        totalResources: { $sum: { $size: "$resourceCount" } },
        lastSeen: { $max: "$lastUpdated" }
      }
    },
    { $sort: { totalResources: -1 } }
  ]);

  return sendSuccess(res, 200, 'Resource usage analytics fetched successfully', {
    usage: analytics.map(item => ({
      service: item._id,
      totalResources: item.totalResources,
      metrics: item.metrics,
      lastSeen: item.lastSeen
    }))
  });
});
