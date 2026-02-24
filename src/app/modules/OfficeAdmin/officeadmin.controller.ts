import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { officeAdminServices } from "./officeadmin.service";

const addWorker = catchAsync(async (req, res) => {
  const result = await officeAdminServices.addWorker(
    req.body,
    req.user as JwtPayload,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    data: result,
  });
});

const addCompanyUser = catchAsync(async (req, res) => {
  const result = await officeAdminServices.addCompanyUser(
    req.body,
    req.user as JwtPayload,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    data: result,
  });
});

const reassignTask = catchAsync(async (req, res) => {
  const id = req.params.taskId;
  const user = req.user as JwtPayload;
  const result = await officeAdminServices.reassignTask(id, req.body, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    data: result,
  });
});

const getOfficeAdminDashboardStats = catchAsync(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const result = await officeAdminServices.getOfficeAdminDashboardStats(year);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    data: result,
  });
});

const getAllEmployees = catchAsync(async (req, res) => {
  const result = await officeAdminServices.getAllEmployees(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    meta: result.meta,
    data: result.result,
  });
});

const getAllSites = catchAsync(async (req, res) => {
  const result = await officeAdminServices.getAllSites(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    meta: result.meta,
    data: result.result,
  });
});

const getSitesWithAssignedUsers = catchAsync(async (req, res) => {
  const result = await officeAdminServices.getSitesWithAssignedUsers(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    meta: result.meta,
    data: result.data,
  });
});

const getSiteAssignedUserTasks = catchAsync(async (req, res) => {
  const siteId = req.params.siteId;
  const userId = req.params.userId;
  const result = await officeAdminServices.getSiteAssignedUserTasks(
    siteId,
    userId,
    req.query,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    data: result,
  });
});

export const officeAdminControllers = {
  addWorker,
  addCompanyUser,
  reassignTask,
  getOfficeAdminDashboardStats,
  getAllEmployees,
  getAllSites,
  getSitesWithAssignedUsers,
  getSiteAssignedUserTasks,
};
