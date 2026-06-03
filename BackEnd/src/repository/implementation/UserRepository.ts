import { BaseRepository } from "../baseRepository";
import {
  UserModel,
  IUserModel,
  IMenterModel,
  ILearnerModel,
  IAdminModel,
} from "../../models/user.model";
import { IUserRepo } from "../interface/IUserRepo";
import { Profile } from "passport-google-oauth20";
import {
  ILearnerStreask,
  IRole,
  mentorApprovalStatus,
} from "../../types/user.types";
import { FilterQuery, Types } from "mongoose";
import { graphPrps, Mentorstatus } from "../../types/adminDahsboard.type";

export class UserRepository
  extends BaseRepository<IUserModel>
  implements IUserRepo
{
  constructor() {
    super(UserModel);
  }
  async createUser(user: IUserModel): Promise<IUserModel> {
    const createdUser = await this.create(user);

    return createdUser;
  }

  async findUserByEmail(
    email: string,
  ): Promise<IUserModel | IMenterModel | ILearnerModel | IAdminModel | null> {
    const user = await this.model.findOne({ email }).lean();
    if (!user) return null;
    switch (user?.role) {
      case "mentor":
        return user as unknown as IMenterModel;
      case "learner":
        return user as unknown as ILearnerModel;
      case "admin":
        return user as unknown as IAdminModel;
      default:
        return user as unknown as IUserModel;
    }
  }
  async updateUserPassword(
    email: string,
    password: string,
  ): Promise<IUserModel | null> {
    return await this.findUserAndUpdate(
      { email },
      { $set: { password: password } },
      { new: true },
    );
  }
  async findOrCreateUser(
    profile: Profile,
    role?: IRole,
  ): Promise<IUserModel | null> {
    let user = await this.findOne({
      $or: [{ googleId: profile.id }, { email: profile.emails?.[0].value }],
    });

    if (!user) {
      user = await this.create({
        googleId: profile.id,
        email: profile.emails?.[0].value,
        name: profile.displayName,
        role: role,
        isActive: true,
        isVerified: true,
      });
    }
    return user;
  }

  async findAllUsers(
    limit: number,
    skip: number,
    searchQuery?: string,
  ): Promise<IUserModel[] | null> {
    return this.findAll(
      {
        role: { $ne: IRole.Admin },
        name: { $regex: searchQuery ?? "", $options: "i" },
      },
      limit,
      skip,
    );
  }

  async findUserCount(searchQuery?: string): Promise<number> {
    return this.countDocuments({
      name: { $regex: searchQuery ?? "", $options: "i" },
    });
  }

  async blockUser(id: Types.ObjectId): Promise<IUserModel | null> {
    return this.model.findByIdAndUpdate(
      id,
      [{ $set: { isActive: { $not: "$isActive" } } }],
      {
        new: true,
        upsert: false,
      },
    );
  }
  async findUserById(id: Types.ObjectId): Promise<IUserModel | null> {
    return await this.findById(id);
  }

  async userProfilePictureUpdate(
    id: Types.ObjectId,
    imageURL: string,
  ): Promise<IUserModel | null> {
    return await this.model.findByIdAndUpdate(
      id,
      { profilePicture: imageURL },
      { new: true },
    );
  }
  async updateMentorStatus(
    id: Types.ObjectId,
    status: mentorApprovalStatus,
  ): Promise<IUserModel | null> {
    return await this.findByIDAndUpdate(id, { ApprovalStatus: status });
  }
  async updateUserprofile(
    id: Types.ObjectId,
    profileData: Partial<
      IUserModel | IMenterModel | ILearnerModel | IAdminModel
    >,
  ): Promise<IUserModel | IAdminModel | null> {
    return await this.findByIDAndUpdateProfile(id, profileData);
  }
  async getUserProfile(
    userId: Types.ObjectId,
  ): Promise<IUserModel | IMenterModel | ILearnerModel | IAdminModel | null> {
    return await this.findOne({ _id: userId });
  }
  async findUser(
    filter: FilterQuery<IUserModel>,
  ): Promise<IUserModel | IMenterModel | ILearnerModel | IAdminModel | null> {
    return await this.findOne(filter);
  }
  async findDashBoardUserCount(
    role: IRole,
    start: Date,
    end: Date,
  ): Promise<number> {
    return await this.countDocuments({
      role,
      createdAt: {
        $gte: start,
        $lte: end,
      },
    });
  }

  async SignedUsers(filter: FilterQuery<IUserModel>): Promise<graphPrps[]> {
    return await this.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          value: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          value: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);
  }
  async updateLearnerStreak(
    learnerId: Types.ObjectId,
    updatedData: ILearnerStreask,
  ): Promise<ILearnerModel | null> {
    return await this.findByIDAndUpdate<ILearnerModel>(learnerId, {
      $set: { learningStreak: updatedData },
    });
  }
  async getMentorStatus(
    filter: FilterQuery<IUserModel>,
  ): Promise<Mentorstatus[]> {
    return await this.aggregate<Mentorstatus>([
      { $match: filter },
      {
        $group: {
          _id: null,
          approved: {
            $sum: {
              $cond: [{ $eq: ["$ApprovalStatus", "approved"] }, 1, 0],
            },
          },
          rejected: {
            $sum: {
              $cond: [{ $eq: ["$ApprovalStatus", "rejected"] }, 1, 0],
            },
          },
        },
      },
    ]);
  }
}
