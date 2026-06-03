import { HttpResponse } from "../../const/error-message.const";
import { HttpStatus } from "../../const/http-status.const";
import { ILearnerModel, IMenterModel } from "../../models/user.model";
import { IUserRepo } from "../../repository/interface/IUserRepo";
import { createHttpError } from "../../utils/http-error";
import { IAdminService } from "../interface/IAdminService";
import { parseObjectId } from "../../mongoose/objectId";
import { LearnerDTO, MentorDTO } from "../../dtos/role.dto";
import { ILearnerDTO, IMentorDTO } from "../../types/dtos.type/user.dto.types";
import { IRole, mentorApprovalStatus } from "../../types/user.types";
import { timeFilter } from "../../utils/dashFilterGenerator.utils";
import { NotificationTemplates } from "../../template/notification.template";
import { INotificationRepository } from "../../repository/interface/INotificationRepository";
import { notificationDto } from "../../dtos/notification.dto";
import { INotificationDTO } from "../../types/dtos.type/notification.dto.types";
import { ICourseRepository } from "../../repository/interface/ICourseRepository";
import { IEnrolledRepository } from "../../repository/interface/IEnrolledRepositoy";
import { ITransactionRepository } from "../../repository/interface/ITransactionRepository";
import { adminDashboardDTO } from "../../dtos/adminDashboard.dto";
import { IAdminDashboardDTO } from "../../types/dtos.type/adminDashboard.dto.type";
import { FilterByDate } from "../../const/filter.const";
import redisClient from "../../config/redis.config";

export type UserFetchResponse = {
  safeUsers: IMentorDTO | ILearnerDTO[];
  totalPage: number;
};

export class AdminService implements IAdminService {
  constructor(
    private _userRepo: IUserRepo,
    private _notificationRepository: INotificationRepository,
    private _courseRepository: ICourseRepository,
    private _transactionRepository: ITransactionRepository,
    private _enrolledRepository: IEnrolledRepository,
  ) {}

  async fetchAllUsers(
    page: number,
    search: string,
  ): Promise<UserFetchResponse> {
    const limit = 6;
    const skip = (page - 1) * limit;

    const [allUsers, userCount] = await Promise.all([
      this._userRepo.findAllUsers(limit, skip, search),
      this._userRepo.findUserCount(search),
    ]);
    if (!allUsers) {
      throw createHttpError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpResponse.SERVER_ERROR,
      );
    }

    const safeUsers = allUsers.map((user) => {
      switch (user.role) {
        case IRole.Admin:
          return MentorDTO(user as IMenterModel);
        case IRole.Learner:
          return LearnerDTO(user as ILearnerModel);
        default:
          return {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            profilePicture: user.profilePicture,
            isActive: user.isActive,
            role: user.role,
            ApprovalStatus: user.ApprovalStatus,
          };
      }
    });
    const totalPage = Math.ceil(userCount / limit);
    return { safeUsers, totalPage };
  }

  async blockUser(id: string): Promise<{ isActive: boolean; id: string }> {
    const objectId = parseObjectId(id);
    if (!objectId) {
      throw createHttpError(
        HttpStatus.BAD_REQUEST,
        HttpResponse.INVALID_CREDNTIALS,
      );
    }

    const updatedUser = await this._userRepo.blockUser(objectId);

    if (!updatedUser) {
      throw createHttpError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpResponse.SERVER_ERROR,
      );
    }
    if (!updatedUser.isActive) {
      await redisClient.set(`blocked:user:${objectId}`, "true");
    } else {
      await redisClient.del(`blocked:user:${objectId}`);
    }
    const result = {
      isActive: updatedUser.isActive,
      id: updatedUser.id,
    };

    return result;
  }
  async userProfile(userId: string): Promise<ILearnerDTO | IMentorDTO | null> {
    const user_Id = parseObjectId(userId);
    if (!user_Id) {
      throw createHttpError(
        HttpStatus.BAD_REQUEST,
        HttpResponse.INVALID_CREDNTIALS,
      );
    }

    const profileData = await this._userRepo.findUserById(user_Id);
    if (!profileData) {
      throw createHttpError(HttpStatus.NOT_FOUND, HttpResponse.USER_NOT_FOUND);
    }

    switch (profileData.role) {
      case IRole.Mentor:
        return MentorDTO(profileData as IMenterModel);
      case IRole.Learner:
        return LearnerDTO(profileData as ILearnerModel);
      default:
        return {
          id: profileData._id,
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          profilePicture: profileData.profilePicture,
          isActive: profileData.isActive,
          role: profileData.role,
          ApprovalStatus: profileData.ApprovalStatus,
          isRequested: profileData.isRequested,
        };
    }
  }
  async approveMentor(
    mentorId: string,
    status: mentorApprovalStatus,
    feedback?: string,
  ): Promise<{
    status: mentorApprovalStatus;
    notification: INotificationDTO;
  }> {
    const mentor_ID = parseObjectId(mentorId);
    if (!mentor_ID) {
      throw createHttpError(
        HttpStatus.BAD_REQUEST,
        HttpResponse.INVALID_CREDNTIALS,
      );
    }

    const approvedData = await this._userRepo.updateMentorStatus(
      mentor_ID,
      status,
    );
    if (!approvedData) {
      throw createHttpError(HttpStatus.NOT_FOUND, HttpResponse.USER_NOT_FOUND);
    }
    let notificationData;
    if (status == "approved") {
      notificationData = NotificationTemplates.mentorApproval(approvedData._id);
    } else {
      notificationData = NotificationTemplates.mentorReject(
        approvedData._id,
        feedback as string,
      );
    }
    const createdNtfy =
      await this._notificationRepository.createNotification(notificationData);

    return {
      status: approvedData.ApprovalStatus,
      notification: notificationDto(createdNtfy),
    };
  }
  async getDashboardData(
    filter?: FilterByDate,
    startDay?: string,
    endDay?: string,
  ): Promise<IAdminDashboardDTO> {
    const { start, end } = timeFilter(filter, startDay, endDay);

    const [
      mentors,
      learners,
      courseCount,
      revenue,
      topCourse,
      topCategory,
      mentorStatus,
    ] = await Promise.all([
      this._userRepo.findDashBoardUserCount(IRole.Mentor, start, end),
      this._userRepo.findDashBoardUserCount(IRole.Learner, start, end),
      this._courseRepository.findDocumentCount({}, start, end),
      this._transactionRepository.getAdminRevenue(start, end),
      this._enrolledRepository.getTopSellingCourse(undefined, start, end),
      this._enrolledRepository.getTopSellingCategory(),
      this._userRepo.getMentorStatus({
        role: IRole.Mentor,
        createdAt: { $gte: start, $lte: end },
      }),
    ]);
    const mentorStatusData = mentorStatus[0] ?? { approved: 0, rejected: 0 };
    return adminDashboardDTO(
      mentors,
      learners,
      courseCount,
      revenue,
      topCourse,
      topCategory,
      mentorStatusData,
    );
  }
}
