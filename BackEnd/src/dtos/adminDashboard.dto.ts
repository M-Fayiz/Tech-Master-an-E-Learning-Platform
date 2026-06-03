import { Mentorstatus, SourceOfRevanye } from "../types/adminDahsboard.type";
import { IAdminDashboardDTO } from "../types/dtos.type/adminDashboard.dto.type";
import { ITopCategory, ITopCourse } from "../types/mentorDashboard.types";

export function adminDashboardDTO(
  mentor: number,
  learners: number,
  courses: number,
  revenue: SourceOfRevanye[],
  topCourse: ITopCourse[],
  topCategory: ITopCategory[],
  mentorStatus: Mentorstatus,
): IAdminDashboardDTO {
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
