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

  // Create base array with 0 values
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formattedMonthlyData = months.map((month, index) => ({
    month,
    amount: 0,
  }));

  // Fill actual values
  monthlyEarnings.forEach((item) => {
    formattedMonthlyData[item._id - 1].amount = item.total;
  });

  const totalEarnings = formattedMonthlyData.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  const totalUsers = await UserModel.countDocuments();
  const totalCompanies = await CompanyModel.countDocuments();

  return {
    year: selectedYear,
    totalEarnings,
    totalUsers,
    totalCompanies,
    monthlyStats: formattedMonthlyData,
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

  if (!user.hasActiveSubscription) {
    throw new AppError(HttpStatus.NOT_FOUND, "Company has no subscription now");
  }

  // 3️⃣ Find subscription
  const subscription = await UserSubscriptionModel.findById(
    user.currentSubscriptionId,
  ).select("planId startDate endDate");

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

const getUserSubscriptions = async (query: Record<string, unknown>) => {
  const subsQuery = new QueryBuilder(
    UserSubscriptionModel.find().select(
      "userId planId subscriptionType status startDate endDate amountPaid",
    ),
    query,
  )
    .search([
      "planId.name",
      "subscriptionType",
      "status",
      "userId.companyId.name",
    ])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await subsQuery.modelQuery

    .populate({
      path: "userId",
      select: "name email companyId",
      populate: {
        path: "companyId",
        select: "name workType",
      },
    })
    .populate("planId", "name duration");

  const meta = await subsQuery.countTotal();

  // --- Revenue by Plan Duration ---
  const revenueAggregation = await UserSubscriptionModel.aggregate([
    {
      $match: {
        subscriptionType: "paid",
        amountPaid: { $exists: true, $gt: 0 },
      },
    },
    {
      $lookup: {
        from: "subscriptionplans",
        localField: "planId",
        foreignField: "_id",
        as: "plan",
      },
    },
    { $unwind: "$plan" },
    {
      $group: {
        _id: "$plan.duration", // 30, 180, 365
        planName: { $first: "$plan.name" },
        totalRevenue: { $sum: "$amountPaid" },
        totalSubscriptions: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Shape: { "1 Month": { totalRevenue: X, totalSubscriptions: Y }, ... }
  const revenue: Record<
    string,
    { totalRevenue: number; totalSubscriptions: number }
  > = {};

  revenueAggregation.forEach((item) => {
    revenue[item.planName] = {
      totalRevenue: item.totalRevenue,
      totalSubscriptions: item.totalSubscriptions,
    };
  });

  return {
    data: result,
    meta,
    revenue,
  };
};

export const adminServices = {
  getDashboardStats,
  getCompanies,
  getUsersUnderCompanyDetails,
  getCompanySubscription,
  getUserSubscriptions,
};
