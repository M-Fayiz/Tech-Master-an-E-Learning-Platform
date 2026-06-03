import { FilterByDate } from "../../const/filter.const";
import { graphPrps } from "../../types/adminDahsboard.type";
import {
  CourseDashboardDTO,
  IChartTrendDTO,
} from "../../types/dtos.type/courseDashboard.dto.type";

import {
  IEnrolledCoursedetailsDTO,
  IEnrolledListDto,
} from "../../types/dtos.type/enrolled.dto.type";
import { learnerDashboardCardsDTO } from "../../types/dtos.type/learnerDashboard.dto.type";

import { IMentorDhasboardDTO } from "../../types/dtos.type/mentorDashboard.dto.type";

import { IProgressTrack } from "../../types/enrollment.types";

export interface IEnrolledService {
  getEnrolledCourses(learnerId: string): Promise<IEnrolledListDto[]>;
  getEnrolledCourseDetails(
    enrolledId: string,
  ): Promise<IEnrolledCoursedetailsDTO | null>;
  updatedProgress(
    enroledId: string,
    lecture: string,
    lastSession: string,
  ): Promise<IProgressTrack | null>;
  addRating(enroledId: string, value: number): Promise<number>;
  getCourseEnrolledDashboardData(
    courseId: string,
    mentorId: string,
  ): Promise<CourseDashboardDTO | null>;
  getTrendingCourseGraph(
    courseId: string,
    filter?: FilterByDate,
    startDate?: string,
    endDate?: string,
  ): Promise<IChartTrendDTO[]>;
  getMentorDashboardData(
    mentorId: string,
    filter: FilterByDate,
  ): Promise<IMentorDhasboardDTO>;
  getRevenueGraph(
    filter: string,
    mentorId?: string,
  ): Promise<{
    slotRevanue: graphPrps[];
    courseRevanue: graphPrps[];
    signedUsers: graphPrps[];
  }>;
  learnerDashboardCardData(
    learnerId: string,
  ): Promise<learnerDashboardCardsDTO>;
}
