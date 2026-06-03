"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseRepository = void 0;
const courses_model_1 = require("../../models/courses.model");
const baseRepository_1 = require("../baseRepository");
const logger_config_1 = __importDefault(require("../../config/logger.config"));
class CourseRepository extends baseRepository_1.BaseRepository {
    constructor() {
        super(courses_model_1.courseModel);
    }
    async createCourses(courseData) {
        return await this.create(courseData);
    }
    async fetchCourses(limit, skip, search, category, subcategory, level) {
        let query = {};
        if (search) {
            query["title"] = { $regex: search, $options: "i" };
        }
        if (category) {
            query["categoryId"] = category;
        }
        if (subcategory) {
            query["subCategoryId"] = subcategory;
        }
        if (level) {
            query["level"] = level;
        }
        query["status"] = "approved";
        return await this.findAll(query, limit, skip, [
            "categoryId",
            "subCategoryId",
        ]);
    }
    async updateCourse(courseId, courseData) {
        return await this.findByIDAndUpdate(courseId, courseData);
    }
    async getCourse(courseId) {
        return await this.findById(courseId, ["categoryId", "subCategoryId"]);
    }
    async getMentorDraftedCourses(search, limit, skip, mentorId) {
        let query = {};
        if (search) {
            query["title"] = { $regex: search, $options: "i" };
        }
        query["mentorId"] = mentorId;
        return await this.findAll(query, limit, skip, [
            "categoryId",
            "subCategoryId",
        ]);
    }
    async addSession(courseId, session) {
        return this.pushToArray({ _id: courseId }, "sessions", session);
    }
    async addLecture(courseId, sessionId, lecture) {
        return this.model
            .findOneAndUpdate({ _id: courseId, "sessions._id": sessionId }, { $push: { "sessions.$.lectures": lecture } }, { new: true })
            .lean()
            .exec();
    }
    async findSession(courseId, title) {
        return await this.findOne({
            _id: courseId,
            "sessions.title": { $regex: title, $options: "i" },
        });
    }
    async findLecture(courseId, sessionId, title) {
        return await this.findOne({
            _id: courseId,
            sessions: {
                $elemMatch: {
                    _id: sessionId,
                    lectures: { $elemMatch: { title: { $regex: title, $options: "i" } } },
                },
            },
        });
    }
    async editLecture(courseId, sessionId, lectureId, lecture) {
        logger_config_1.default.info("lecture", lecture);
        return await this.findItemAndUpdate({ _id: courseId }, {
            $set: {
                "sessions.$[s].lectures.$[l].title": lecture.title,
                "sessions.$[s].lectures.$[l].lectureType": lecture.lectureType,
                "sessions.$[s].lectures.$[l].lectureContent": lecture.lectureContent,
            },
        }, {
            new: true,
            arrayFilters: [{ "s._id": sessionId }, { "l._id": lectureId }],
        });
    }
    async updateBaseInfo(courseId, baseInfo) {
        return await this.findByIDAndUpdate(courseId, baseInfo);
    }
    async getAdminCoursList(search, limit, skip) {
        return await this.findAll({
            status: { $in: ["published", "rejected", "approved"] },
            title: { $regex: search ?? "", $options: "i" },
        }, limit, skip, ["categoryId", "subCategoryId", "mentorId"]);
    }
    async getCourseDetails(courseId) {
        return await this.find({ _id: courseId }, [
            "categoryId",
            "subCategoryId",
            "mentorId",
        ]);
    }
    async appproveCourse(courseId) {
        return await this.findByIDAndUpdate(courseId, { status: "approved" });
    }
    async rejectCourse(courseId) {
        return await this.findByIDAndUpdate(courseId, { status: "rejected" });
    }
    async publishCourse(courseId) {
        return await this.findByIDAndUpdate(courseId, { status: "published" });
    }
    async findCourse(courseId) {
        return await this.findOne({ _id: courseId }, [
            "categoryId",
            "subCategoryId",
            "mentorId",
        ]);
    }
    async findDocumentCount(query) {
        return await this.countDocuments(query);
    }
    async findAllCourse(query) {
        return await this.find(query);
    }
    async getCourseFormData(courseId) {
        return await this.findOne({ _id: courseId });
    }
    async removeSession(courseId, sessionId) {
        return this.pullFromArray({ _id: courseId }, "sessions", {
            _id: sessionId,
        });
    }
    async removeLecture(courseId, sessionId, lectureId) {
        return this.model
            .findOneAndUpdate({
            _id: courseId,
            "sessions._id": sessionId,
        }, {
            $pull: {
                "sessions.$.lectures": { _id: lectureId },
            },
        }, { new: true })
            .lean()
            .exec();
    }
}
exports.CourseRepository = CourseRepository;
