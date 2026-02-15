import HttpStatus from "http-status";
import { ISite } from "./site.interface";
import { SiteModel } from "./site.model";
import AppError from "../../erros/AppError";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import { UserModel } from "../User/user.model";
import QueryBuilder from "../../../builder/QueryBuilder";
import { CompanyModel } from "../Company/company.model";
import { JwtPayload } from "../../interface/global";
import { SiteTaskModel } from "../SiteTask/task.model";

const addSite = async (files: Express.Multer.File[], payload: ISite) => {
  const isOfficeAdminExist = await UserModel.findById(payload.createdBy);
  if (!isOfficeAdminExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Office admin not found");
  }
  const company = await CompanyModel.findById(isOfficeAdminExist.companyId);
  if (!company) {
    throw new AppError(HttpStatus.BAD_REQUEST, "company not found");
  }
  const endDate = new Date(payload.endDate);
  const currentDate = new Date();

  // Optional: Validate that endDate is in the future
  if (endDate < currentDate) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Site deadline must be in the future",
    );
  }
  // Handle photo uploads
  let photoUrls: string[] = [];

  if (files && files.length > 0) {
    // Validate file types (only images)
    const invalidFiles = files.filter(
      (file) => !file.mimetype.startsWith("image/"),
    );
    if (invalidFiles.length > 0) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Only image files are allowed for site photos",
      );
    }

    // Upload files to Cloudinary
    const uploadPromises = files.map((file) =>
      sendFileToCloudinary(file.buffer, file.originalname, file.mimetype),
    );

    try {
      const uploadResults = await Promise.all(uploadPromises);
      photoUrls = uploadResults.map((result) => result.secure_url);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Failed to upload photos to Cloudinary",
      );
    }
  }

  // Prepare site data
  const siteData: Partial<ISite> = {
    createdBy: isOfficeAdminExist._id,
    companyId: company._id,
    siteOwner: payload.siteOwner.trim(),
    siteTitle: payload.siteTitle.trim(),
    buildingType: payload.buildingType,
    location: {
      address: payload.location.address.trim(),
      coordinates: {
        lat: payload.location.coordinates.lat,
        lng: payload.location.coordinates.lng,
      },
    },
    status: payload.status || "To-Do",
    endDate: endDate,
    photos: photoUrls,
  };

  // Create site in database
  const newSite = await SiteModel.create(siteData);
  return newSite;
};

const getSites = async (user: JwtPayload, query: Record<string, unknown>) => {
  const isUserExist = await UserModel.findById(user.user);

  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  // ✅ OFFICE ADMIN
  if (isUserExist.role === "office_admin") {
    const siteQuery = new QueryBuilder(
      SiteModel.find({ createdBy: isUserExist._id }),
      query,
    )
      .filter()
      .fields()
      .paginate();

    const meta = await siteQuery.countTotal();
    const result = await siteQuery.modelQuery;

    return { meta, result };
  }

  if (isUserExist.role === "worker") {
    const siteIds = await SiteTaskModel.find({
      assignedTo: isUserExist._id,
    }).distinct("siteId");

    const siteQuery = new QueryBuilder(
      SiteModel.find({
        _id: { $in: siteIds },
      }),
      query,
    )
      .filter()
      .fields()
      .paginate();

    const meta = await siteQuery.countTotal();
    const result = await siteQuery.modelQuery;

    return { meta, result };
  }

  throw new AppError(HttpStatus.FORBIDDEN, "Unauthorized access");
};

const getEachSite = async (id: string) => {
  const isSiteExist = await SiteModel.findById(id);
  if (!isSiteExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Site not found");
  }
  return isSiteExist;
};

export const siteServices = {
  addSite,
  getSites,
  getEachSite,
};
