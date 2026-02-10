import HttpStatus from "http-status";
import { IUser } from "../User/user.interface";
import { UserModel } from "../User/user.model";
import AppError from "../../erros/AppError";
import { JwtPayload } from "../../interface/global";
import { workerInviteEmailTemplate } from "./officeadmin.utils";
import { sendEmail } from "../../utils/sendEmail";
import { CompanyModel } from "../Company/company.model";

const addWorker = async (payload: IUser, user: JwtPayload) => {
  // 1️⃣ Check admin existence
  const isUserExist = await UserModel.findById(user.user);
  if (!isUserExist) {
    throw new AppError(HttpStatus.BAD_REQUEST, "User not found");
  }

  const company = await CompanyModel.findById(isUserExist.companyId);
  if (!company) {
    throw new AppError(HttpStatus.BAD_REQUEST, "company not found");
  }
  // 2️⃣ Check if worker already exists
  const existingUser = await UserModel.findOne({ email: payload.email });
  if (existingUser) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "User already exists with this email",
    );
  }

  // 3️⃣ Prepare worker data
  const workerData: Partial<IUser> = {
    companyId: company._id,
    email: payload.email,
    password: payload.password, // ⚠️ hash in pre-save hook
    name: payload.name,
    phoneNumber: payload.phoneNumber,
    address: payload.address,
    role: "worker",
    experience: payload.experience,
    expertiseArea: payload.expertiseArea,
    employmentType: payload.employmentType,
    isVerified: true,
  };

  // 4️⃣ Create worker
  const worker = await UserModel.create(workerData);

  // 5️⃣ Send email with credentials
  const emailHtml = workerInviteEmailTemplate({
    name: payload.name,
    email: payload.email,
    password: payload.password, // sending original password
    companyName: company.name,
  });

  const mail = await sendEmail(
    payload.email,
    "Your employee account has been created",
    emailHtml,
  );
  console.log(mail);
  return worker;
};

export const officeAdminServices = {
  addWorker,
};
