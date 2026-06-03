import { TransactionType } from "../../const/transaction.const";
import { Mentorstatus } from "../adminDahsboard.type";
import { ITopCategory, ITopCourse } from "../mentorDashboard.types";

interface RevanueSource {
  name: TransactionType;
  value: number;
}

export interface IAdminDashboardDTO {
  totalMentors: number;
  totalLearners: number;
  SourceOfRevenue: RevanueSource[];
  totalCourses: number;
  topSelling: {
    course: ITopCourse[];
    category: ITopCategory[];
  };
  mentorStatus: Mentorstatus;
}
