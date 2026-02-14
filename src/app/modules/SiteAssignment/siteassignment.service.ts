import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { SiteModel } from "../Site/site.model";
import { ISiteAssignment } from "./siteassignment.interface";
import { SiteAssignmentModel } from "./siteassignment.model";
import { JwtPayload } from "../../interface/global";
import { Types } from "mongoose";
import { SiteFileModel } from "../SiteFile/sitefile.model";
import { UserModel } from "../User/user.model";

const assignTaskToWorker = async (
  user: JwtPayload,
  payload: ISiteAssignment,
) => {
  const userId = new Types.ObjectId(user.user);
  const isSiteFileExist = await SiteFileModel.findById(payload.fileId);
  if (!isSiteFileExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Site file not exist");
  }
  const isSiteExist = await SiteModel.findById(isSiteFileExist.siteId);
  if (!isSiteExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Site not exist");
  }
  const isOficeAdminExist = await UserModel.findById(userId);
  if (!isOficeAdminExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Office ADMIN not exist");
  }
  const isWorkerExist = await UserModel.findById(payload.workerId);
  if (!isWorkerExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Worker not exist");
  }
  const isAlreadyAssigned = await SiteAssignmentModel.findOne({
    fileId: isSiteFileExist._id,
    workerId: isWorkerExist._id,
  });
  if (isAlreadyAssigned) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "This worker is already assigned to this file",
    );
  }
  payload.siteId = isSiteExist._id;
  payload.assignedBy = isOficeAdminExist._id;
  const result = await SiteAssignmentModel.create(payload);
  return result;
};

export const siteAssignmentServices = {
  assignTaskToWorker,
};
