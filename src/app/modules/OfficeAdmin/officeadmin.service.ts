import HttpStatus from "http-status";
import { IUser } from "../User/user.interface";
import { UserModel } from "../User/user.model";
import AppError from "../../erros/AppError";
import { JwtPayload } from "../../interface/global";
import { workerInviteEmailTemplate } from "./officeadmin.utils";
import { sendEmail } from "../../utils/sendEmail";
import { CompanyModel } from "../Company/company.model";
import { Types } from "mongoose";
import { SiteTaskModel } from "../SiteTask/task.model";
import { SiteModel } from "../Site/site.model";
import { SiteFileModel } from "../SiteFile/sitefile.model";
import QueryBuilder from "../../../builder/QueryBuilder";

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

const addCompanyUser = async (payload: Partial<IUser>, user: JwtPayload) => {
  // 1️⃣ Check logged-in user
  const isUserExist = await UserModel.findById(user.user);
  if (!isUserExist) {
    throw new AppError(HttpStatus.BAD_REQUEST, "User not found");
  }

  // 2️⃣ Check company
  const company = await CompanyModel.findById(isUserExist.companyId);
  if (!company) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Company not found");
  }

  // 3️⃣ Validate role
  if (!payload.role || !["office_admin", "worker"].includes(payload.role)) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Role must be either office_admin or worker",
    );
  }

  // 4️⃣ Check if email already exists
  const existingUser = await UserModel.findOne({ email: payload.email });
  if (existingUser) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "User already exists with this email",
    );
  }

  // 5️⃣ Prepare user data
  const userData: Partial<IUser> = {
    companyId: company._id,
    email: payload.email,
    password: payload.password, // hashed in pre-save hook
    name: payload.name,
    phoneNumber: payload.phoneNumber,
    role: payload.role, // office_admin or worker
    isVerified: true,
  };

  // 6️⃣ Create user
  const newUser = await UserModel.create(userData);

  // 7️⃣ Send email
  const emailHtml = workerInviteEmailTemplate({
    name: payload.name as string,
    email: payload.email as string,
    password: payload.password as string,
    companyName: company.name,
  });

  await sendEmail(
    payload.email as string,
    `Your ${payload.role === "office_admin" ? "Office Admin" : "Worker"} account has been created`,
    emailHtml,
  );

  return newUser;
};

const reassignTask = async (
  taskId: string,
  payload: { newAssigneeId: string },
  user: JwtPayload,
) => {
  const requesterId = new Types.ObjectId(user.user);

  // 1️⃣ Check requester exists and is an office_admin
  const requester = await UserModel.findById(requesterId);
  if (!requester) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  if (requester.role !== "office_admin") {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only office admins can reassign tasks",
    );
  }

  // 2️⃣ Check task exists
  const task = await SiteTaskModel.findById(taskId);
  if (!task) {
    throw new AppError(HttpStatus.NOT_FOUND, "Task not found");
  }

  // 3️⃣ Only allow reassignment on To-Do or In-Progress
  if (!["To-Do", "In-Progress"].includes(task.status)) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      `Cannot reassign a task with status "${task.status}". Only To-Do and In-Progress tasks can be reassigned`,
    );
  }

  // 4️⃣ Check new assignee exists
  const newAssignee = await UserModel.findById(payload.newAssigneeId);
  if (!newAssignee) {
    throw new AppError(HttpStatus.NOT_FOUND, "New assignee not found");
  }

  // 5️⃣ Prevent reassigning to the same person
  if (task.assignedTo?.toString() === payload.newAssigneeId) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Task is already assigned to this user",
    );
  }

  // 6️⃣ Silently replace assignedTo
  const updatedTask = await SiteTaskModel.findByIdAndUpdate(
    taskId,
    {
      assignedTo: new Types.ObjectId(payload.newAssigneeId),
      assignedAt: new Date(),
    },
    { new: true, runValidators: true },
  )
    .populate("assignedTo", "name email profileImage role")
    .populate("assignedBy", "name email profileImage role");

  return updatedTask;
};

const getOfficeAdminDashboardStats = async (year?: number) => {
  const selectedYear = year || new Date().getFullYear();
  const startDate = new Date(`${selectedYear}-01-01`);
  const endDate = new Date(`${selectedYear}-12-31`);

  const totalSites = await SiteModel.countDocuments();
  const totalUsers = await UserModel.countDocuments();
  const totalProjects = await SiteFileModel.countDocuments();

  const monthlyProjects = await SiteFileModel.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const monthlyData = Array(12).fill(0);
  monthlyProjects.forEach((item) => {
    monthlyData[item._id - 1] = item.count;
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

  return {
    year: selectedYear,
    totalSites,
    totalUsers,
    totalProjects,
    chart: {
      labels: months,
      data: monthlyData,
    },
  };
};

const getAllEmployees = async (query: Record<string, unknown>) => {
  const employeeQuery = new QueryBuilder(
    UserModel.find().select(
      "-password -otp -fcmToken -currentSubscriptionId -hasActiveSubscription -expiresAt -passwordChangedAt",
    ),
    query,
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await employeeQuery.modelQuery.populate("companyId", "name");

  const meta = await employeeQuery.countTotal();

  return {
    result,
    meta,
  };
};

const getAllSites = async (query: Record<string, unknown>) => {
  const employeeQuery = new QueryBuilder(SiteModel.find(), query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await employeeQuery.countTotal();
  const result = await employeeQuery.modelQuery;

  return {
    result,
    meta,
  };
};

const getSitesWithAssignedUsers = async (query: Record<string, unknown>) => {
  const siteQuery = new QueryBuilder(SiteModel.find(), query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const sites = await siteQuery.modelQuery;
  const meta = await siteQuery.countTotal();

  const siteIds = sites.map((site) => site._id);

  const assignedUsers = await SiteTaskModel.aggregate([
    {
      $match: {
        siteId: { $in: siteIds },
        assignedTo: { $exists: true, $ne: null },
      },
    },
    {
      // deduplicate: one user once per site
      $group: {
        _id: { siteId: "$siteId", assignedTo: "$assignedTo" },
      },
    },
    {
      // collect unique users per site
      $group: {
        _id: "$_id.siteId",
        assignedUserId: { $first: "$_id.assignedTo" }, // single user
        totalAssignedUsers: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "assignedUserId",
        foreignField: "_id",
        as: "assignedUser",
      },
    },
    { $unwind: { path: "$assignedUser", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        totalAssignedUsers: 1,
        assignedUser: {
          _id: "$assignedUser._id",
          name: "$assignedUser.name",
          email: "$assignedUser.email",
          profileImage: "$assignedUser.profileImage",
        },
      },
    },
  ]);

  const assignedMap = new Map(
    assignedUsers.map((item) => [item._id.toString(), item]),
  );

  const data = sites.map((site) => {
    const assigned = assignedMap.get((site._id as Types.ObjectId).toString());
    return {
      ...site.toObject(),
      assignedUser: assigned?.assignedUser || null,
    };
  });

  return {
    data,
    meta,
  };
};

const getSiteAssignedUserTasks = async (
  siteId: string,
  userId: string,
  query: Record<string, unknown>,
) => {
  const site = await SiteModel.findById(siteId);
  if (!site) {
    throw new AppError(HttpStatus.NOT_FOUND, "Site not found");
  }

  const user = await UserModel.findById(userId).select(
    "-password -otp -fcmToken -currentSubscriptionId -hasActiveSubscription -expiresAt -passwordChangedAt",
  );
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  const taskQuery = new QueryBuilder(
    SiteTaskModel.find({
      siteId: new Types.ObjectId(siteId),
      assignedTo: new Types.ObjectId(userId),
    }),
    query,
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await taskQuery.modelQuery
    .populate("fileId", "name fileUrl")
    .populate("assignedTo", "name email profileImage")
    .populate("assignedBy", "name email profileImage");

  const meta = await taskQuery.countTotal();

  return {
    meta,
    user,
    result,
  };
};

export const officeAdminServices = {
  addWorker,
  addCompanyUser,
  reassignTask,
  getOfficeAdminDashboardStats,
  getAllEmployees,
  getAllSites,
  getSitesWithAssignedUsers,
  getSiteAssignedUserTasks,
};
