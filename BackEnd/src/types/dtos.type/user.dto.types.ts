import { Types } from "mongoose";
import { IRole, mentorApprovalStatus } from "../user.types";
import {
  IAdminModel,
  ILearnerModel,
  IMenterModel,
} from "../../models/user.model";

export interface IBaseRoleDTO {
  id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  role: IRole;
  profilePicture?: string;
  isActive: boolean;
  bio?: string;
  ApprovalStatus: mentorApprovalStatus;
}

export interface IMentorDTO extends IBaseRoleDTO {
  expertise?: string[];
  socialLinks?: object;
  mentorRating?: number;
  resume?: string;
  ApprovalStatus: mentorApprovalStatus;
  isRequested?: boolean;
}

export interface ILearnerDTO extends IBaseRoleDTO {
  enrolledCourses?: Types.ObjectId[];
}

export interface IAdminDTO extends IBaseRoleDTO {}

export interface IUserDTO {
  id: Types.ObjectId;
  name?: string;
  email: string;
  profile: string | undefined;
  role: IRole;
  isVerified: boolean;
  ApprovalStatus?: mentorApprovalStatus;
  isRequested?: boolean;
}

export interface IPayloadDTO {
  _id: Types.ObjectId;
  email: string;
  role: string;
  sessionId?: Types.ObjectId;
}

export type RoleModelMap = {
  learner: ILearnerModel;
  mentor: IMenterModel;
  admin: IAdminModel;
};

export interface ISignedUsers {
  data: string;
  value: number;
}
