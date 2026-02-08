/* eslint-disable @typescript-eslint/no-unused-vars */
import HttpStatus from "http-status";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "../User/user.model";
import AppError from "../../erros/AppError";
import { ISiteFile } from "./sitefile.interface";
import { SiteModel } from "../Site/site.model";
import { getFileTypeCategory } from "../../utils/multer";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import { SiteFileModel } from "./sitefile.model";

const uploadFiles = async (
  user: JwtPayload,
  payload: ISiteFile,
  files: Express.Multer.File[],
) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  const isSiteExist = await SiteModel.findById(payload.siteId);
  if (!isSiteExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Site not found");
  }
  if (!files || files.length === 0) {
    throw new AppError(HttpStatus.BAD_REQUEST, "No files provided");
  }
  const MAX_FILES = 5;
  if (files.length > MAX_FILES) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      `Maximum ${MAX_FILES} files allowed per upload`,
    );
  }
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);
  if (oversizedFiles.length > 0) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      `Files exceed maximum size of 10MB: ${oversizedFiles.map((f) => f.originalname).join(", ")}`,
    );
  }

  const uploadResults: {
    fileName: string;
    fileType: string;
    fileUrl: string;
    fileSize: number;
  }[] = [];

  const uploadPromises = files.map(async (file) => {
    try {
      const cloudinaryResult = await sendFileToCloudinary(
        file.buffer,
        file.originalname,
        file.mimetype,
      );

      return {
        fileName: file.originalname,
        fileType: getFileTypeCategory(file.mimetype),
        fileUrl: cloudinaryResult.secure_url,
        fileSize: file.size,
      };
    } catch (error) {
      console.error(`Failed to upload ${file.originalname}:`, error);
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        `Failed to upload file: ${file.originalname}`,
      );
    }
  });

  try {
    const results = await Promise.all(uploadPromises);
    uploadResults.push(...results);
  } catch (error) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Failed to upload files to cloud storage",
    );
  }

  // Save file records to database
  const fileDocuments = uploadResults.map((result) => ({
    uploadedBy: isUserExist._id,
    siteId: isSiteExist._id,
    fileName: payload.fileName,
    fileType: result.fileType,
    fileUrl: result.fileUrl,
    fileSize: result.fileSize,
  }));

  try {
    const savedFiles = await SiteFileModel.insertMany(fileDocuments);
    return savedFiles;
  } catch (error) {
    console.error("Database error:", error);
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Failed to save file records to database",
    );
  }
};

export const siteFileServices = {
  uploadFiles,
};
