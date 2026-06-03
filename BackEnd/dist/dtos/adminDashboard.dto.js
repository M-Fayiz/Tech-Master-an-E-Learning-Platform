"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDashboardDTO = adminDashboardDTO;
function adminDashboardDTO(mentor, learners, courses, revenue, topCourse, topCategory, mentorStatus) {
    let updated = revenue.map((data) => ({ name: data._id, value: data.value }));
    return {
        totalCourses: courses,
        totalLearners: learners,
        totalMentors: mentor,
        SourceOfRevenue: updated,
        topSelling: {
            category: topCategory,
            course: topCourse,
        },
        mentorStatus: {
            approved: mentorStatus.approved ?? 0,
            rejected: mentorStatus.rejected ?? 0,
        },
    };
}
