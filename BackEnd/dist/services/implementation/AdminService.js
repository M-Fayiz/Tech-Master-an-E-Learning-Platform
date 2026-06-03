"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const error_message_const_1 = require("../../const/error-message.const");
const http_status_const_1 = require("../../const/http-status.const");
const http_error_1 = require("../../utils/http-error");
const objectId_1 = require("../../mongoose/objectId");
const role_dto_1 = require("../../dtos/role.dto");
const user_types_1 = require("../../types/user.types");
const dashFilterGenerator_utils_1 = require("../../utils/dashFilterGenerator.utils");
const notification_template_1 = require("../../template/notification.template");
const notification_dto_1 = require("../../dtos/notification.dto");
const adminDashboard_dto_1 = require("../../dtos/adminDashboard.dto");
const redis_config_1 = __importDefault(require("../../config/redis.config"));
class AdminService {
    constructor(_userRepo, _notificationRepository, _courseRepository, _transactionRepository, _enrolledRepository) {
        this._userRepo = _userRepo;
        this._notificationRepository = _notificationRepository;
        this._courseRepository = _courseRepository;
        this._transactionRepository = _transactionRepository;
        this._enrolledRepository = _enrolledRepository;
    }
    async fetchAllUsers(page, search) {
        const limit = 6;
        const skip = (page - 1) * limit;
        const [allUsers, userCount] = await Promise.all([
            this._userRepo.findAllUsers(limit, skip, search),
            this._userRepo.findUserCount(search),
        ]);
        if (!allUsers) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.INTERNAL_SERVER_ERROR, error_message_const_1.HttpResponse.SERVER_ERROR);
        }
        const safeUsers = allUsers.map((user) => {
            switch (user.role) {
                case user_types_1.IRole.Admin:
                    return (0, role_dto_1.MentorDTO)(user);
                case user_types_1.IRole.Learner:
                    return (0, role_dto_1.LearnerDTO)(user);
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
    async blockUser(id) {
        const objectId = (0, objectId_1.parseObjectId)(id);
        if (!objectId) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.BAD_REQUEST, error_message_const_1.HttpResponse.INVALID_CREDNTIALS);
        }
        const updatedUser = await this._userRepo.blockUser(objectId);
        if (!updatedUser) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.INTERNAL_SERVER_ERROR, error_message_const_1.HttpResponse.SERVER_ERROR);
        }
        if (!updatedUser.isActive) {
            await redis_config_1.default.set(`blocked:user:${objectId}`, "true");
        }
        else {
            await redis_config_1.default.del(`blocked:user:${objectId}`);
        }
        const result = {
            isActive: updatedUser.isActive,
            id: updatedUser.id,
        };
        return result;
    }
    async userProfile(userId) {
        const user_Id = (0, objectId_1.parseObjectId)(userId);
        if (!user_Id) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.BAD_REQUEST, error_message_const_1.HttpResponse.INVALID_CREDNTIALS);
        }
        const profileData = await this._userRepo.findUserById(user_Id);
        if (!profileData) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.NOT_FOUND, error_message_const_1.HttpResponse.USER_NOT_FOUND);
        }
        switch (profileData.role) {
            case user_types_1.IRole.Mentor:
                return (0, role_dto_1.MentorDTO)(profileData);
            case user_types_1.IRole.Learner:
                return (0, role_dto_1.LearnerDTO)(profileData);
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
    async approveMentor(mentorId, status, feedback) {
        const mentor_ID = (0, objectId_1.parseObjectId)(mentorId);
        if (!mentor_ID) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.BAD_REQUEST, error_message_const_1.HttpResponse.INVALID_CREDNTIALS);
        }
        const approvedData = await this._userRepo.updateMentorStatus(mentor_ID, status);
        if (!approvedData) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.NOT_FOUND, error_message_const_1.HttpResponse.USER_NOT_FOUND);
        }
        let notificationData;
        if (status == "approved") {
            notificationData = notification_template_1.NotificationTemplates.mentorApproval(approvedData._id);
        }
        else {
            notificationData = notification_template_1.NotificationTemplates.mentorReject(approvedData._id, feedback);
        }
        const createdNtfy = await this._notificationRepository.createNotification(notificationData);
        return {
            status: approvedData.ApprovalStatus,
            notification: (0, notification_dto_1.notificationDto)(createdNtfy),
        };
    }
    async getDashboardData(filter, startDay, endDay) {
        const { start, end } = (0, dashFilterGenerator_utils_1.timeFilter)(filter, startDay, endDay);
        const [mentors, learners, courseCount, revenue, topCourse, topCategory, mentorStatus,] = await Promise.all([
            this._userRepo.findDashBoardUserCount(user_types_1.IRole.Mentor, start, end),
            this._userRepo.findDashBoardUserCount(user_types_1.IRole.Learner, start, end),
            this._courseRepository.findDocumentCount({}, start, end),
            this._transactionRepository.getAdminRevenue(start, end),
            this._enrolledRepository.getTopSellingCourse(undefined, start, end),
            this._enrolledRepository.getTopSellingCategory(),
            this._userRepo.getMentorStatus({
                role: user_types_1.IRole.Mentor,
                createdAt: { $gte: start, $lte: end },
            }),
        ]);
        const mentorStatusData = mentorStatus[0] ?? { approved: 0, rejected: 0 };
        return (0, adminDashboard_dto_1.adminDashboardDTO)(mentors, learners, courseCount, revenue, topCourse, topCategory, mentorStatusData);
    }
}
exports.AdminService = AdminService;
