import { FilterQuery, Types, UpdateQuery } from "mongoose";
import { IEnrolledModel } from "../../models/enrolled.model";
import {
  chartAggregation,
  chartFilter,
  IEnrolledAggregation,
  IEnrollement,
} from "../../types/enrollment.types";
import {
  CourseDetailsRating,
  IMentorDashboardData,
  ITopCategory,
  ITopCourse,
} from "../../types/mentorDashboard.types";
import {
  InProgressCourse,
  LearnerCourseCard,
} from "../../types/learnerDashboard.type";

export interface IEnrolledRepository {
  enrolleCourse(enrollData: IEnrollement): Promise<IEnrolledModel | null>;
  getEnrolledCourses(
    learnerId: Types.ObjectId,
  ): Promise<IEnrolledModel[] | null>;
  getEnrolledCOurseDetails(
    enrolledId: Types.ObjectId,
  ): Promise<IEnrolledModel | null>;
  isEnrolled(
    learnerId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<IEnrolledModel | null>;
  updatedProgress(
    enrolledId: Types.ObjectId,
    lecture: Types.ObjectId,
  ): Promise<IEnrolledModel | null>;
  addRating(
    enrolledId: Types.ObjectId,
    value: number,
  ): Promise<IEnrolledModel | null>;
  getEnrolledDasgboardData(
    courseId: Types.ObjectId,
    mentorId: Types.ObjectId,
  ): Promise<IEnrolledAggregation[] | null>;
  getCourseEnrollmentTrend(
    courseId: Types.ObjectId,
    filterChart: chartFilter,
  ): Promise<chartAggregation[]>;
  getMentorDashboardData(
    mentorId: Types.ObjectId,
    start: Date,
    end: Date,
  ): Promise<IMentorDashboardData[]>;
  getTopSellingCourse(
    mentorId?: Types.ObjectId,
    start?: Date,
    end?: Date,
  ): Promise<ITopCourse[]>;
  getTopSellingCategory(mentorId?: Types.ObjectId): Promise<ITopCategory[]>;
  getLearnerDashboardCourseData(
    learnerId: Types.ObjectId,
  ): Promise<LearnerCourseCard[]>;
  updateEnrolledData(
    enrolledId: Types.ObjectId,
    data: UpdateQuery<IEnrolledModel>,
  ): Promise<IEnrolledModel | null>;
  avgCourseRating(courseId: Types.ObjectId): Promise<CourseDetailsRating[]>;
  getInprogressCourse(
    learnerId: Types.ObjectId,
    populate: string[],
  ): Promise<InProgressCourse[] | null>;
  findEnrlloedCourse(
    filter: FilterQuery<IEnrolledModel>,
  ): Promise<IEnrolledModel | null>;
}
