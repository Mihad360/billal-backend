import { Types } from "mongoose";
import { CompanyModel } from "./company.model";
import { ICompany } from "./company.interface";
import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { UserModel } from "../User/user.model";
import { JwtPayload } from "../../interface/global";

const addCompany = async (payload: ICompany, user: JwtPayload) => {
  // 1️⃣ Get userId from token
  const userId = new Types.ObjectId(user.user);

  // 2️⃣ Check if company already exists for this user
  const existingCompany = await CompanyModel.findOne({ userId });

  if (existingCompany) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Company already exists for you",
    );
  }

  // 3️⃣ Prepare company data
  const companyData: Partial<ICompany> = {
    userId,
    name: payload.name,
    address: payload.address,
    workType: payload.workType,
    email: payload.email,
    phone: payload.phone,
    website: payload.website,
    description: payload.description,
    isActive: true,
  };

  // 4️⃣ Create company
  const company = await CompanyModel.create(companyData);

  // 5️⃣ Update user with companyId
  await UserModel.findByIdAndUpdate(
    userId,
    {
      companyId: company._id,
    },
    { new: true },
  );

  // 🔥 6️⃣ Optional: start 15-day free trial
  // await SubscriptionService.startTrial(company._id);

  return company;
};

export const companyServices = {
  addCompany,
};
