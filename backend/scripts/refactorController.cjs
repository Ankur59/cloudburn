const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../src/controllers/awsConfig.controller.js');
const rawContent = fs.readFileSync(srcPath, 'utf8');

// The file contains:
// imports
// getOrgCreds
// connectAWS
// getCost
// getFullBilling

// We split by string finding.
const split1 = rawContent.indexOf('// ── GET /api/aws/cost ─────────────────────────────────────────────────────────');

const awsConfigContent = rawContent.slice(0, split1).trim() + '\n';
const remaining = rawContent.slice(split1);

// Generate awsBilling.controller.js
const billingImports = `
import asyncHandler from "../middlewares/async.middleware.js";
import Organization from "../models/organization.model.js";
import AppError from "../utils/AppError.js";
import { sendSuccess } from "../utils/responseHelper.js";
import { decrypt } from "../utils/encryption.js";
import {
  getAwsCost,
  getMonthlyCostByService,
  getCostByRegion,
  getCostByUsageType,
  getCostByOperation,
  getCostByRecordType,
  getDailySpendTrend,
  getCostByTeam,
  getCostByTeamInstances,
  getMonthComparison,
  transformAwsCost,
  getTotalCost,
  aggregateByDate,
  aggregateByService,
  aggregateByTeam,
} from "../services/aws.service.js";
import { buildDashboardData } from "../services/dashboard.service.js";
import { saveDailyCosts } from "../services/cost.service.js";
import BillingSnapshot from "../models/billingSnapshot.model.js";
import { refreshRAGForOrg } from "../loaders/rag.loader.js";

const getOrgCreds = async (orgId) => {
  const org = await Organization.findById(orgId).select(
    "+awsAccessKey +awsSecretKey",
  );
  if (!org?.awsAccessKey || !org?.awsSecretKey || !org?.awsRegion) return null;
  return {
    accessKey: decrypt(org.awsAccessKey),
    secretKey: decrypt(org.awsSecretKey),
    region: org.awsRegion,
  };
};
`;

const awsBillingContent = billingImports.trim() + '\n\n' + remaining.trim() + '\n';

fs.writeFileSync(srcPath, awsConfigContent);
fs.writeFileSync(path.join(__dirname, '../src/controllers/awsBilling.controller.js'), awsBillingContent);

// Also we need to update the routes
const routesPath = path.join(__dirname, '../src/routes/awsConfig.routes.js');
const routesContent = fs.readFileSync(routesPath, 'utf8');

let newRoutesContent = routesContent.replace(
  /} from "\.\.\/controllers\/awsConfig\.controller\.js";/,
  `} from "../controllers/awsConfig.controller.js";\nimport { getCost, getFullBilling } from "../controllers/awsBilling.controller.js";`
);

newRoutesContent = newRoutesContent.replace('getCost,', '').replace('getFullBilling,', '');

fs.writeFileSync(routesPath, newRoutesContent);

console.log('Successfully split awsConfig.controller.js into awsBilling.controller.js');
