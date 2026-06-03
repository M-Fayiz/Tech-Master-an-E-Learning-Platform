"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseService = void 0;
const objectId_1 = require("../../mongoose/objectId");
const course_dtos_1 = require("../../dtos/course.dtos");
const http_error_1 = require("../../utils/http-error");
const http_status_const_1 = require("../../const/http-status.const");
const error_message_const_1 = require("../../const/error-message.const");
const send_mail_util_1 = require("../../utils/send-mail.util");
const notification_template_1 = require("../../template/notification.template");
const notification_dto_1 = require("../../dtos/notification.dto");
const review_dto_1 = require("../../dtos/review.dto");
class CourseService {
    constructor(_courseRepository, _categoryRepository, _enrolledRepository, _notificationRepository, _reviewRepository) {
        this._courseRepository = _courseRepository;
        this._categoryRepository = _categoryRepository;
        this._enrolledRepository = _enrolledRepository;
        this._notificationRepository = _notificationRepository;
        this._reviewRepository = _reviewRepository;
    }
    async createCourses(course) {
        const now = new Date();
        const year = new Date();
        year.setDate(year.getDate() - 365);
        const mentorCourse = await this._courseRepository.findAllCourse({
            mentorId: course.mentorId,
            createdAt: {
                $gte: year,
                $lte: now,
            },
        });
        if (mentorCourse && mentorCourse.length > 5) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.CONFLICT, error_message_const_1.HttpResponse.ITEM_EXIST);
        }
        const createdCourse = await this._courseRepository.createCourses(course);
        return (0, course_dtos_1.CourseFormDataDTO)(createdCourse);
    }
    async fetchCourses(page, limit, search, category, subcategory, level, learnerId) {
        let category_Id;
        let subCategory_id;
        let learner_Id;
        if (category) {
            category_Id = (0, objectId_1.parseObjectId)(category);
        }
        if (subcategory) {
            subCategory_id = (0, objectId_1.parseObjectId)(subcategory);
        }
        if (learnerId) {
            learner_Id = (0, objectId_1.parseObjectId)(learnerId);
        }
        let skip = (page - 1) * limit;
        let query = {};
        if (search) {
            query["title"] = { $regex: search, $options: "i" };
        }
        if (category) {
            query["`categoryId`"] = category;
        }
        if (subcategory) {
            query["subCategoryId"] = subcategory;
        }
        if (level) {
            query["level"] = level;
        }
        query["status"] = "approved";
        const [courseList, totalDocument] = await Promise.all([
            this._courseRepository.fetchCourses(limit, skip, search, category_Id, subCategory_id, level),
            this._courseRepository.findDocumentCount(query),
        ]);
        let enrolledCourse;
        if (learner_Id) {
            enrolledCourse =
                await this._enrolledRepository.getEnrolledCourses(learner_Id);
        }
        if (!courseList) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.NOT_FOUND, error_message_const_1.HttpResponse.ITEM_NOT_FOUND);
        }
        const enrolledIds = new Set(enrolledCourse?.map((c) => String(c.courseId._id ?? c.courseId)));
        const mappedCourseList = courseList.map((course) => (0, course_dtos_1.courseListDTO)(course, enrolledIds));
        let totalPage = totalDocument / limit;
        return { courseData: mappedCourseList, totalPage };
    }
    async updateCourseData(courseId, courseData, courseUpdatePart) {
        const Id = (0, objectId_1.parseObjectId)(courseId);
        console.log("udate course", Id);
        if (!Id) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.BAD_REQUEST, error_message_const_1.HttpResponse.INVALID_ID);
        }
        switch (courseUpdatePart) {
            case "sessions":
                return await this._courseRepository.addSession(Id, courseData);
        }
        return null;
    }
    async getCourse(courseId, learnerId) {
        const course_id = (0, objectId_1.parseObjectId)(courseId);
        if (!course_id) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.BAD_REQUEST, error_message_const_1.HttpResponse.INVALID_ID);
        }
        const learner_id = learnerId ? (0, objectId_1.parseObjectId)(learnerId) : null;
        const [courseData, reviews, summery] = await Promise.all([
            this._courseRepository.getCourseDetails(course_id),
            this._reviewRepository.getCourseReview(course_id),
            this._enrolledRepository.avgCourseRating(course_id),
        ]);
        const mappedReview = reviews
            ? reviews?.map((review) => (0, review_dto_1.popularedReviewDTO)(review))
            : [];
        if (!courseData || courseData.length === 0) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.NOT_FOUND, error_message_const_1.HttpResponse.ITEM_NOT_FOUND);
        }
        let isEnrolled = null;
        if (learner_id) {
            const data = await this._enrolledRepository.isEnrolled(learner_id, course_id);
            if (data) {
                isEnrolled = data._id;
            }
        }
        const avgRating = summery?.[0]?.avgRating ?? 0;
        const totalStudents = summery?.[0]?.totalStudents ?? 0;
        return {
            courseDetails: (0, course_dtos_1.courseDetailsPageDTO)(courseData[0], mappedReview, avgRating, totalStudents),
            enrolledId: isEnrolled,
        };
    }
    async getDraftedCourses(search, page, mentorId) {
        const id = (0, objectId_1.parseObjectId)(mentorId);
        if (!id) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.OK, error_message_const_1.HttpResponse.INVALID_ID);
        }
        let limit = 6;
        let skip = (Number(page) - 1) * limit;
        let query = {};
        if (search) {
            query["title"] = { $regex: search, $options: "i" };
        }
        query["mentorId"] = mentorId;
        const [courseData, documnetCount] = await Promise.all([
            this._courseRepository.getMentorDraftedCourses(search, limit, skip, id),
            this._courseRepository.findDocumentCount(query),
        ]);
        const mappedCourseList = courseData?.map((course) => (0, course_dtos_1.formCourseDto)(course));
        let totalPage = Math.floor(documnetCount / limit);
        console.log(totalPage);
        return mappedCourseList
            ? { courseData: mappedCourseList, totalPage: totalPage }
            : null;
    }
    async addSessions(courseId, session) {
        const id = (0, objectId_1.parseObjectId)(courseId);
        if (!id) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.BAD_REQUEST, error_message_const_1.HttpResponse.INVALID_ID);
        }
        const isExist = await this._courseRepository.findSession(id, session.title);
        if (isExist) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.CONFLICT, error_message_const_1.HttpResponse.ITEM_EXIST);
        }
        await this._courseRepository.addSession(id, session);
        const courseData = await this._courseRepository.findCourse(id);
        if (!courseData) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.NOT_FOUND, error_message_const_1.HttpResponse.COURSE_NOT_FOUND);
        }
        return (0, course_dtos_1.courseDTO)(courseData);
    }
    async addLectures(courseId, sessionId, lecture) {
        const CourseId = (0, objectId_1.parseObjectId)(courseId);
        const SessionId = (0, objectId_1.parseObjectId)(sessionId);
        if (!CourseId || !SessionId) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.BAD_REQUEST, error_message_const_1.HttpResponse.INVALID_ID);
        }
        const isExist = await this._courseRepository.findLecture(CourseId, SessionId, lecture.title);
        if (isExist) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.CONFLICT, error_message_const_1.HttpResponse.ITEM_EXIST);
        }
        await this._courseRepository.addLecture(CourseId, SessionId, lecture);
        const courseData = await this._courseRepository.findCourse(CourseId);
        return (0, course_dtos_1.courseDTO)(courseData);
    }
    async editLecture(courseId, sessionId, lectureId, lecture) {
        const CourseId = (0, objectId_1.parseObjectId)(courseId);
        const SessionId = (0, objectId_1.parseObjectId)(sessionId);
        const LectureId = (0, objectId_1.parseObjectId)(lectureId);
        if (!CourseId || !SessionId || !LectureId) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.BAD_REQUEST, error_message_const_1.HttpResponse.INVALID_ID);
        }
        await this._courseRepository.editLecture(CourseId, SessionId, LectureId, lecture);
        const coursedata = await this._courseRepository.findCourse(CourseId);
        if (!coursedata) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.NOT_FOUND, error_message_const_1.HttpResponse.COURSE_NOT_FOUND);
        }
        return (0, course_dtos_1.courseDTO)(coursedata);
    }
    async updateBaseCourseInfo(courseId, baseInfo) {
        const id = (0, objectId_1.parseObjectId)(courseId);
        if (!id) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.BAD_REQUEST, error_message_const_1.HttpResponse.INVALID_ID);
        }
        await this._courseRepository.updateBaseInfo(id, baseInfo);
        const courseData = await this._courseRepository.findCourse(id);
        return (0, course_dtos_1.courseDTO)(courseData);
    }
    async getAdminCourse(search, page) {
        const limit = 4;
        const skip = (page - 1) * limit;
        const adminCoursList = await this._courseRepository.getAdminCoursList(search, limit, skip);
        return adminCoursList
            ? adminCoursList.map((course) => (0, course_dtos_1.formCourseDto)(course))
            : null;
    }
    async getCourseDetails(courseId) {
        const id = (0, objectId_1.parseObjectId)(courseId);
        if (!id) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.BAD_REQUEST, error_message_const_1.HttpResponse.INVALID_ID);
        }
        const courseDetails = await this._courseRepository.getCourseDetails(id);
        return courseDetails ? (0, course_dtos_1.formCourseDto)(courseDetails[0]) : null;
    }
    async approveCourse(courseId) {
        const course_id = (0, objectId_1.parseObjectId)(courseId);
        if (!course_id) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.BAD_REQUEST, error_message_const_1.HttpResponse.INVALID_ID);
        }
        const courseDetails = await this._courseRepository.appproveCourse(course_id);
        const notifyData = notification_template_1.NotificationTemplates.courseApproval(courseDetails?.mentorId, courseDetails?.title);
        const savedNotify = await this._notificationRepository.createNotification(notifyData);
        const notifyDTO = (0, notification_dto_1.notificationDto)(savedNotify);
        return {
            status: courseDetails?.status ? courseDetails?.status : null,
            notifyDTO,
        };
    }
    async rejectCourse(courseId, feedBack, email) {
        const id = (0, objectId_1.parseObjectId)(courseId);
        if (!id) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.BAD_REQUEST, error_message_const_1.HttpResponse.INVALID_ID);
        }
        const courseDetails = await this._courseRepository.rejectCourse(id);
        const notifyData = notification_template_1.NotificationTemplates.courseRejection(courseDetails?.mentorId, courseDetails?.title, feedBack);
        const savedNotify = await this._notificationRepository.createNotification(notifyData);
        const notifyDTO = (0, notification_dto_1.notificationDto)(savedNotify);
        if (courseDetails?.status == "rejected") {
            await (0, send_mail_util_1.sendMail)(email, "Feedback On Your Course", feedBack);
        }
        return {
            courseStatus: courseDetails ? courseDetails.status : null,
            notifyDTO,
        };
    }
    async publishCourse(courseId) {
        const id = (0, objectId_1.parseObjectId)(courseId);
        if (!id) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.BAD_REQUEST, error_message_const_1.HttpResponse.INVALID_ID);
        }
        const courseDetails = await this._courseRepository.publishCourse(id);
        return courseDetails ? courseDetails.status : null;
    }
    /**
     * Fetches a mentor’s courses and maps them to a simplified DTO
     * containing only course IDs and titles.
     * @param mentorId
     * @returnsA promise resolving to an array of course summaries
     * @throws HttpErros if no course are found
     */
    async fetchCourseListForSlot(mentorId) {
        const mentor_Id = (0, objectId_1.parseObjectId)(mentorId);
        const courseList = await this._courseRepository.findAllCourse({
            mentorId: mentor_Id,
        });
        if (!courseList) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.NOT_FOUND, error_message_const_1.HttpResponse.COURSE_NOT_FOUND);
        }
        return courseList.map((course) => (0, course_dtos_1.listCourseForSLot)(course));
    }
    async getCourseFormData(courseId, user) {
        const course_Id = (0, objectId_1.parseObjectId)(courseId);
        if (!course_Id) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.BAD_REQUEST, error_message_const_1.HttpResponse.INVALID_ID);
        }
        const courseFormData = await this._courseRepository.getCourseFormData(course_Id);
        console.log(courseFormData?.mentorId, " < > ", user._id);
        if (!courseFormData) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.NOT_FOUND, error_message_const_1.HttpResponse.COURSE_NOT_FOUND);
        }
        if (courseFormData.mentorId.toString() !== user._id.toString()) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.FORBIDDEN, error_message_const_1.HttpResponse.ACCESS_DENIED);
        }
        if (!courseFormData) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.NOT_FOUND, error_message_const_1.HttpResponse.COURSE_NOT_FOUND);
        }
        return (0, course_dtos_1.CourseFormDataDTO)(courseFormData);
    }
    async removeSession(courseId, sessionId) {
        const course_id = (0, objectId_1.parseObjectId)(courseId);
        const session_id = (0, objectId_1.parseObjectId)(sessionId);
        if (!course_id || !session_id) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.BAD_REQUEST, error_message_const_1.HttpResponse.INVALID_ID);
        }
        const removedData = await this._courseRepository.removeSession(course_id, session_id);
        return (0, course_dtos_1.CourseFormDataDTO)(removedData);
    }
    async getAdminCourseDetails(courseId) {
        const course_id = (0, objectId_1.parseObjectId)(courseId);
        if (!course_id) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.BAD_REQUEST, error_message_const_1.HttpResponse.INVALID_ID);
        }
        const courseData = await this._courseRepository.getCourseDetails(course_id);
        if (!courseData || courseData.length === 0) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.NOT_FOUND, error_message_const_1.HttpResponse.ITEM_NOT_FOUND);
        }
        return (0, course_dtos_1.formCourseDto)(courseData[0]);
    }
}
exports.CourseService = CourseService;
