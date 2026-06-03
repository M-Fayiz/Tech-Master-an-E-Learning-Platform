"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrolledCourseDetailDTO = exports.enrolledListDTO = void 0;
const course_dtos_1 = require("./course.dtos");
const enrolledListDTO = (enrolledData) => {
    return {
        _id: enrolledData._id,
        completedPercentage: enrolledData.progress?.completionPercentage ?? 0,
        course: (0, course_dtos_1.formCourseDto)(enrolledData.courseId),
    };
};
exports.enrolledListDTO = enrolledListDTO;
const enrolledCourseDetailDTO = (enrolledData, CourseDetails) => {
    return {
        _id: enrolledData._id,
        completedPercentage: enrolledData.progress?.completionPercentage ?? 0,
        course: CourseDetails,
        courseId: enrolledData.courseId,
        learnerId: enrolledData.learnerId,
        mentorId: enrolledData.mentorId,
        rating: enrolledData.rating ?? 0,
        progress: enrolledData.progress ? enrolledData.progress : null,
    };
};
exports.enrolledCourseDetailDTO = enrolledCourseDetailDTO;
