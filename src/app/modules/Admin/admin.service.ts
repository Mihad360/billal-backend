import HttpStatus from "http-status";
import { Types } from "mongoose";
import QueryBuilder from "../../../builder/QueryBuilder";
import { CompanyModel } from "../Company/company.model";
import { SiteModel } from "../Site/site.model";
import {
  SubscriptionPlanModel,
  UserSubscriptionModel,
} from "../Subscription/subscription.model";
import { UserModel } from "../User/user.model";
import { companySearch } from "./admin.utils";
import AppError from "../../erros/AppError";

const getDashboardStats = async (year?: number) => {
  const selectedYear = year || new Date().getFullYear();

  const startDate = new Date(`${selectedYear}-01-01`);
  const endDate = new Date(`${selectedYear}-12-31`);

  // 1️⃣ Total Earnings
  const totalEarningsResult = await UserSubscriptionModel.aggregate([
    {
      $match: {
        subscriptionType: "paid",
        amountPaid: { $exists: true },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amountPaid" },
      },
    },
  ]);

  const totalEarnings = totalEarningsResult[0]?.total || 0;

  // 2️⃣ Monthly Earnings
  const monthlyEarnings = await UserSubscriptionModel.aggregate([
    {
      $match: {
        subscriptionType: "paid",
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        total: { $sum: "$amountPaid" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const monthlyData = Array(12).fill(0);

  monthlyEarnings.forEach((item) => {
    monthlyData[item._id - 1] = item.total;
  });

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const totalUsers = await UserModel.countDocuments();
  const totalCompanies = await CompanyModel.countDocuments();

  return {
    year: selectedYear,
    totalEarnings,
    totalUsers,
    totalCompanies,
    chart: {
      labels: months,
      data: monthlyData,
    },
  };
};

const getCompanies = async (query: Record<string, unknown>) => {
  const companyQuery = new QueryBuilder(
    CompanyModel.find().sort({ createdAt: -1 }),
    query,
  )
    .search(companySearch)
    .filter()
    .fields()
    .paginate();

  const meta = await companyQuery.countTotal();
  const result = await companyQuery.modelQuery;
  return { meta, result };
};

const getUsersUnderCompanyDetails = async (
  companyId: string,
  query: Record<string, unknown>,
) => {
  const companyObjectId = new Types.ObjectId(companyId);

  /* ------------------ Build user query with QueryBuilder ------------------ */
  const userQuery = new QueryBuilder(
    UserModel.find({ companyId: companyObjectId }).select(
      "-password -otp -fcmToken -currentSubscriptionId -hasActiveSubscription -expiresAt -passwordChangedAt",
    ),
    query,
  )
    .search(["name", "email"]) // searchTerm in query targets these fields
    .filter() // passes remaining filters (e.g. role, status)
    .sort()
    .paginate()
    .fields();

  /* ------------------ Run queries in parallel ------------------ */
  const [company, users, paginationMeta, workerCount, sites] =
    await Promise.all([
      CompanyModel.findById(companyObjectId),

      userQuery.modelQuery.lean(),

      userQuery.countTotal(),

      // Worker count — always company-scoped, unaffected by query filters
      UserModel.countDocuments({
        companyId: companyObjectId,
        role: "worker",
      }),

      SiteModel.find({ companyId: companyObjectId })
        .select("_id name status")
        .lean(),
    ]);

  return {
    meta: {
      ...paginationMeta,
      workerCount,
      siteCount: sites.length,
    },
    company,
    users,
  };
};

const getCompanySubscription = async (companyId: string) => {
  // 1️⃣ Find company
  const company = await CompanyModel.findById(companyId);
  if (!company) {
    throw new AppError(HttpStatus.NOT_FOUND, "Company not found");
  }

  // 2️⃣ Find company owner (user)
  const user = await UserModel.findById(company.userId);
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "Company owner not found");
  }

  if (!user.currentSubscriptionId) {
    throw new AppError(HttpStatus.NOT_FOUND, "Company has no subscription now");
  }

  // 3️⃣ Find subscription
  const subscription = await UserSubscriptionModel.findById(
    user.currentSubscriptionId,
  );

  if (!subscription) {
    throw new AppError(HttpStatus.NOT_FOUND, "Subscription not found");
  }

  // 4️⃣ Find plan
  const plan = await SubscriptionPlanModel.findById(subscription.planId);
  if (!plan) {
    throw new AppError(HttpStatus.NOT_FOUND, "Plan not found");
  }

  return {
    subscription,
    plan,
  };
};

export const adminServices = {
  getDashboardStats,
  getCompanies,
  getUsersUnderCompanyDetails,
  getCompanySubscription,
};
