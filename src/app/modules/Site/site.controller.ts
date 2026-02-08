import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { siteServices } from "./site.service";

const addSite = catchAsync(async (req, res) => {
  const files = req.files as Express.Multer.File[];
  const result = await siteServices.addSite(files, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    data: result,
  });
});

const getSites = catchAsync(async (req, res) => {
  const result = await siteServices.getSites(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    meta: result.meta,
    data: result.result,
  });
});

const getEachSite = catchAsync(async (req, res) => {
  const id = req.params.siteId;
  const result = await siteServices.getEachSite(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    data: result,
  });
});

export const siteControllers = {
  addSite,
  getSites,
  getEachSite,
};
