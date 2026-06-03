"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrolledRepository = void 0;
const baseRepository_1 = require("../baseRepository");
const enrolled_model_1 = require("../../models/enrolled.model");
const enrollment_types_1 = require("../../types/enrollment.types");
class EnrolledRepository extends baseRepository_1.BaseRepository {
    constructor() {
        super(enrolled_model_1.EnrolleModel);
    }
    async enrolleCourse(enrollData) {
        return await this.create(enrollData);
    }
    async getEnrolledCourses(learnerId) {
        return await this.model
            .find({ learnerId })
            .populate({
            path: "courseId",
            populate: [
                { path: "categoryId" },
                { path: "subCategoryId" },
                { path: "mentorId", select: "name email" },
            ],
        })
            .lean()
            .exec();
    }
    async getEnrolledCOurseDetails(enrolledId) {
        return await this.findById(enrolledId);
    }
    async isEnrolled(learnerId, courseId) {
        return await this.findOne({ learnerId: learnerId, courseId: courseId });
    }
    async updatedProgress(enrolledId, lectureId) {
        return this.model.findOneAndUpdate({ _id: enrolledId }, {
            $addToSet: {
                "progress.completedLectures": lectureId,
            },
        }, { new: true }).lean().exec();
    }
    async addRating(enrolledId, value) {
        return await this.findByIDAndUpdate(enrolledId, { rating: value });
    }
    async getEnrolledDasgboardData(courseId, mentorId) {
        return await this.aggregate([
            { $match: { courseId, mentorId } },
            {
                $group: {
                    _id: null,
                    avgRating: {
                        $avg: "$rating",
                    },
                    totalStudents: {
                        $sum: 1,
                    },
                },
            },
        ]);
    }
    async getCourseEnrollmentTrend(courseId, filterChart) {
        return await this.aggregate([
            {
                $match: {
                    courseId: courseId,
                    createdAt: {
                        $gte: filterChart.start,
                        $lte: filterChart.end,
                    },
                },
            },
            {
                $group: {
                    _id: {
                        day: {
                            $dateToString: {
                                format: "%Y-%m-%dT00:00:00Z",
                                date: "$createdAt",
                            },
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { "_id.day": 1 } },
        ]);
    }
    async getMentorDashboardData(mentorId, start, end) {
        return await this.aggregate([
            {
                $match: {
                    mentorId: mentorId,
                    createdAt: { $gte: start, $lte: end },
                },
            },
            {
                $group: {
                    _id: null,
                    avgRating: {
                        $avg: "$rating",
                    },
                    totalStudents: {
                        $sum: 1,
                    },
                },
            },
        ]);
    }
    async getTopSellingCourse(mentorId, start, end) {
        const matchStage = mentorId
            ? {
                mentorId,
                createdAt: {
                    $gte: start,
                    $lte: end,
                },
            }
            : {
                createdAt: {
                    $gte: start,
                    $lte: end,
                },
            };
        return await this.aggregate([
            {
                $match: matchStage,
            },
            {
                $group: {
                    _id: "$courseId",
                    totalStudent: {
                        $sum: 1,
                    },
                },
            },
            {
                $sort: {
                    totalStudent: -1,
                },
            },
            {
                $limit: 5,
            },
            {
                $lookup: {
                    from: "courses",
                    localField: "_id",
                    foreignField: "_id",
                    as: "course",
                },
            },
            {
                $unwind: "$course",
            },
            {
                $project: {
                    courseId: "$course._id",
                    title: "$course.title",
                    enrolledStudent: "$totalStudent",
                },
            },
        ]);
    }
    async getTopSellingCategory(mentorId) {
        const matchStage = mentorId ? { mentorId } : {};
        return await this.aggregate([
            {
                $match: {
                    mentorId: matchStage,
                },
            },
            {
                $group: {
                    _id: "$categoryId",
                    totalStudent: {
                        $sum: 1,
                    },
                },
            },
            {
                $sort: {
                    totalStudent: -1,
                },
            },
            {
                $limit: 5,
            },
            {
                $lookup: {
                    from: "Category",
                    localField: "_id",
                    foreignField: "_id",
                    as: "category",
                },
            },
            {
                $unwind: "$category",
            },
            {
                $project: {
                    courseId: "$_id",
                    title: "$category.title",
                    enrolledStudent: "$totalStudent",
                },
            },
        ]);
    }
    async getLearnerDashboardCourseData(learnerId) {
        const result = await this.aggregate([
            {
                $match: {
                    learnerId: learnerId,
                },
            },
            {
                $group: {
                    _id: `$learnerId`,
                    courseCount: { $sum: 1 },
                    completedCourse: {
                        $sum: {
                            $cond: [
                                { $eq: ["$courseStatus", enrollment_types_1.completionStatus.COMPLETED] },
                                1,
                                0,
                            ],
                        },
                    },
                    inProgressCourse: {
                        $sum: {
                            $cond: [
                                { $eq: ["$courseStatus", enrollment_types_1.completionStatus.IN_PROGRESS] },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]);
        return result;
    }
    async updateEnrolledData(enrolledId, data) {
        return await this.findByIDAndUpdate(enrolledId, data);
    }
    async avgCourseRating(courseId) {
        return await this.aggregate([
            {
                $match: {
                    courseId,
                },
            },
            {
                $group: {
                    _id: null,
                    avgRating: {
                        $avg: "$rating",
                    },
                    totalStudents: {
                        $sum: 1,
                    },
                },
            },
        ]);
    }
    async getInprogressCourse(learnerId, populate) {
        return await this.find({ learnerId, courseStatus: enrollment_types_1.completionStatus.IN_PROGRESS }, populate);
    }
    async findEnrlloedCourse(filter) {
        return await this.findOne(filter);
    }
}
exports.EnrolledRepository = EnrolledRepository;
