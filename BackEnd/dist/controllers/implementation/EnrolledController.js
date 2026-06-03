"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrolledController = void 0;
const http_status_const_1 = require("../../const/http-status.const");
const response_util_1 = require("../../utils/response.util");
const error_message_const_1 = require("../../const/error-message.const");
class EnrolledController {
    constructor(_enrolledService) {
        this._enrolledService = _enrolledService;
        this.getEnrolledCourse = async (req, res, next) => {
            try {
                const user = req.user;
                const enrolledCourseData = await this._enrolledService.getEnrolledCourses(user._id);
                console.log('enrolled data :', enrolledCourseData);
                res
                    .status(http_status_const_1.HttpStatus.OK)
                    .json((0, response_util_1.successResponse)(error_message_const_1.HttpResponse.OK, { enrolledCourseData }));
            }
            catch (error) {
                next(error);
            }
        };
        this.getEnrolledDetails = async (req, res, next) => {
            try {
                const { enrolledId } = req.params;
                const enrolledDetails = await this._enrolledService.getEnrolledCourseDetails(enrolledId);
                res
                    .status(http_status_const_1.HttpStatus.OK)
                    .json((0, response_util_1.successResponse)(error_message_const_1.HttpResponse.OK, { enrolledDetails }));
            }
            catch (error) {
                next(error);
            }
        };
        this.updateProgress = async (req, res, next) => {
            try {
                const { enrolledId } = req.params;
                const { lectureId, sessionId } = req.body;
                const progressData = await this._enrolledService.updatedProgress(enrolledId, lectureId, sessionId);
                res
                    .status(http_status_const_1.HttpStatus.OK)
                    .json((0, response_util_1.successResponse)(error_message_const_1.HttpResponse.OK, { progressData }));
            }
            catch (error) {
                next(error);
            }
        };
        this.addRating = async (req, res, next) => {
            try {
                const { enrolledId } = req.params;
                const { value } = req.body;
                const ratingResult = await this._enrolledService.addRating(enrolledId, value);
                res
                    .status(http_status_const_1.HttpStatus.OK)
                    .json((0, response_util_1.successResponse)(error_message_const_1.HttpResponse.OK, { ratingResult }));
            }
            catch (error) {
                next(error);
            }
        };
        this.getCourseDashboardData = async (req, res, next) => {
            try {
                const { courseId } = req.params;
                const user = req.user;
                const dashboardData = await this._enrolledService.getCourseEnrolledDashboardData(courseId, user._id);
                res
                    .status(http_status_const_1.HttpStatus.OK)
                    .json((0, response_util_1.successResponse)(error_message_const_1.HttpResponse.OK, { dashboardData }));
            }
            catch (error) {
                next(error);
            }
        };
        this.getGraphOFCourse = async (req, res, next) => {
            try {
                const { courseId } = req.params;
                const { filter, startData, endDate } = req.query;
                const chartData = await this._enrolledService.getTrendingCourseGraph(courseId, filter, startData, endDate);
                res
                    .status(http_status_const_1.HttpStatus.OK)
                    .json((0, response_util_1.successResponse)(error_message_const_1.HttpResponse.OK, { chartData }));
            }
            catch (error) {
                next(error);
            }
        };
        this.getMentorDashboardData = async (req, res, next) => {
            try {
                const { filter } = req.query;
                const user = req.user;
                const dashboardData = await this._enrolledService.getMentorDashboardData(user._id, filter);
                res
                    .status(http_status_const_1.HttpStatus.OK)
                    .json((0, response_util_1.successResponse)(error_message_const_1.HttpResponse.OK, { dashboardData }));
            }
            catch (error) {
                next(error);
            }
        };
        this.getmentorRevanue = async (req, res, next) => {
            try {
                const { filter, mentorId } = req.query;
                const { courseRevanue, slotRevanue } = await this._enrolledService.getRevenueGraph(filter, mentorId);
                res
                    .status(http_status_const_1.HttpStatus.OK)
                    .json((0, response_util_1.successResponse)(error_message_const_1.HttpResponse.OK, { courseRevanue, slotRevanue }));
            }
            catch (error) {
                next(error);
            }
        };
        this.getAdminRevanue = async (req, res, next) => {
            try {
                const { filter } = req.query;
                const { courseRevanue, slotRevanue, signedUsers } = await this._enrolledService.getRevenueGraph(filter);
                res.status(http_status_const_1.HttpStatus.OK).json((0, response_util_1.successResponse)(error_message_const_1.HttpResponse.OK, {
                    courseRevanue,
                    slotRevanue,
                    signedUsers,
                }));
            }
            catch (error) {
                next(error);
            }
        };
        this.getLearnerDashboardData = async (req, res, next) => {
            try {
                const user = req.user;
                const dashboardData = await this._enrolledService.learnerDashboardCardData(user._id);
                res.status(http_status_const_1.HttpStatus.OK).json((0, response_util_1.successResponse)(error_message_const_1.HttpResponse.OK, {
                    dashboardData,
                }));
            }
            catch (error) {
                next(error);
            }
        };
    }
}
exports.EnrolledController = EnrolledController;
