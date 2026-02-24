import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { adminServices } from "./admin.service";

const getDashboardStats = catchAsync(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();

  const result = await adminServices.getDashboardStats(year);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Dashboard stats fetched successfully",
    data: result,
  });
});

const getCompanies = catchAsync(async (req, res) => {
  const result = await adminServices.getCompanies(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Dashboard stats fetched successfully",
    meta: result.meta,
    data: result.result,
  });
});

const getUsersUnderCompanyDetails = catchAsync(async (req, res) => {
  const companyId = req.params.companyId;
  const result = await adminServices.getUsersUnderCompanyDetails(
    companyId,
    req.query,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Dashboard stats fetched successfully",
    data: result,
  });
});

const getCompanySubscription = catchAsync(async (req, res) => {
  const companyId = req.params.companyId;
  const result = await adminServices.getCompanySubscription(companyId);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Dashboard stats fetched successfully",
    data: result,
  });
});

const getUserSubscriptions = catchAsync(async (req, res) => {
  const result = await adminServices.getUserSubscriptions(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Dashboard stats fetched successfully",
    data: result,
  });
});

export const adminControllers = {
  getDashboardStats,
  getCompanies,
  getUsersUnderCompanyDetails,
  getCompanySubscription,
  getUserSubscriptions,
};
