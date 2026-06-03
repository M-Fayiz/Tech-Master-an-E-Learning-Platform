"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const baseRepository_1 = require("../baseRepository");
const user_model_1 = require("../../models/user.model");
const user_types_1 = require("../../types/user.types");
class UserRepository extends baseRepository_1.BaseRepository {
    constructor() {
        super(user_model_1.UserModel);
    }
    async createUser(user) {
        const createdUser = await this.create(user);
        return createdUser;
    }
    async findUserByEmail(email) {
        const user = await this.model.findOne({ email }).lean();
        if (!user)
            return null;
        switch (user?.role) {
            case "mentor":
                return user;
            case "learner":
                return user;
            case "admin":
                return user;
            default:
                return user;
        }
    }
    async updateUserPassword(email, password) {
        return await this.findUserAndUpdate({ email }, { $set: { password: password } }, { new: true });
    }
    async findOrCreateUser(profile, role) {
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
    async findAllUsers(limit, skip, searchQuery) {
        return this.findAll({
            role: { $ne: user_types_1.IRole.Admin },
            name: { $regex: searchQuery ?? "", $options: "i" },
        }, limit, skip);
    }
    async findUserCount(searchQuery) {
        return this.countDocuments({
            name: { $regex: searchQuery ?? "", $options: "i" },
        });
    }
    async blockUser(id) {
        return this.model.findByIdAndUpdate(id, [{ $set: { isActive: { $not: "$isActive" } } }], {
            new: true,
            upsert: false,
        });
    }
    async findUserById(id) {
        return await this.findById(id);
    }
    async userProfilePictureUpdate(id, imageURL) {
        return await this.model.findByIdAndUpdate(id, { profilePicture: imageURL }, { new: true });
    }
    async updateMentorStatus(id, status) {
        return await this.findByIDAndUpdate(id, { ApprovalStatus: status });
    }
    async updateUserprofile(id, profileData) {
        return await this.findByIDAndUpdateProfile(id, profileData);
    }
    async getUserProfile(userId) {
        return await this.findOne({ _id: userId });
    }
    async findUser(filter) {
        return await this.findOne(filter);
    }
    async findDashBoardUserCount(role, start, end) {
        return await this.countDocuments({
            role,
            createdAt: {
                $gte: start,
                $lte: end,
            },
        });
    }
    async SignedUsers(filter) {
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
    async updateLearnerStreak(learnerId, updatedData) {
        return await this.findByIDAndUpdate(learnerId, {
            $set: { learningStreak: updatedData },
        });
    }
    async getMentorStatus(filter) {
        return await this.aggregate([
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
exports.UserRepository = UserRepository;
