import { Request, Response, NextFunction } from "express";
import { IEnrolledController } from "../interface/IEnrolledController";
import { HttpStatus } from "../../const/http-status.const";
import { successResponse } from "../../utils/response.util";
import { HttpResponse } from "../../const/error-message.const";
import { IEnrolledService } from "../../services/interface/IEnrolledService";
import { FilterByDate } from "../../const/filter.const";

export class EnrolledController implements IEnrolledController {
  constructor(private _enrolledService: IEnrolledService) {}
  getEnrolledCourse = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as { _id: string };
      const enrolledCourseData = await this._enrolledService.getEnrolledCourses(
        user._id,
      );
      console.log('enrolled data :',enrolledCourseData)
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { enrolledCourseData }));
    } catch (error) {
      next(error);
    }
  };
  getEnrolledDetails = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { enrolledId } = req.params;
      const enrolledDetails =
        await this._enrolledService.getEnrolledCourseDetails(enrolledId);

      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { enrolledDetails }));
    } catch (error) {
      next(error);
    }
  };
  updateProgress = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { enrolledId } = req.params;
      const { lectureId, sessionId } = req.body;

      const progressData = await this._enrolledService.updatedProgress(
        enrolledId,
        lectureId,
        sessionId,
      );
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { progressData }));
    } catch (error) {
      next(error);
    }
  };
  addRating = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { enrolledId } = req.params;
      const { value } = req.body;

      const ratingResult = await this._enrolledService.addRating(
        enrolledId,
        value,
      );

      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { ratingResult }));
    } catch (error) {
      next(error);
    }
  };
  getCourseDashboardData = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { courseId } = req.params;

      const user = req.user as { _id: string };
      const dashboardData =
        await this._enrolledService.getCourseEnrolledDashboardData(
          courseId,
          user._id,
        );

      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { dashboardData }));
    } catch (error) {
      next(error);
    }
  };
  getGraphOFCourse = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { courseId } = req.params;

      const { filter, startData, endDate } = req.query;

      const chartData = await this._enrolledService.getTrendingCourseGraph(
        courseId,
        filter as FilterByDate,
        startData as string,
        endDate as string,
      );

      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { chartData }));
    } catch (error) {
      next(error);
    }
  };
  getMentorDashboardData = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { filter } = req.query;
      const user = req.user as { _id: string };
      const dashboardData = await this._enrolledService.getMentorDashboardData(
        user._id,
        filter as FilterByDate,
      );

      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { dashboardData }));
    } catch (error) {
      next(error);
    }
  };
  getmentorRevanue = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { filter, mentorId } = req.query;

      const { courseRevanue, slotRevanue } =
        await this._enrolledService.getRevenueGraph(
          filter as string,
          mentorId as string,
        );

      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { courseRevanue, slotRevanue }));
    } catch (error) {
      next(error);
    }
  };
  getAdminRevanue = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { filter } = req.query;
      const { courseRevanue, slotRevanue, signedUsers } =
        await this._enrolledService.getRevenueGraph(filter as string);
      res.status(HttpStatus.OK).json(
        successResponse(HttpResponse.OK, {
          courseRevanue,
          slotRevanue,
          signedUsers,
        }),
      );
    } catch (error) {
      next(error);
    }
  };
  getLearnerDashboardData = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as { _id: string };
      const dashboardData =
        await this._enrolledService.learnerDashboardCardData(user._id);
      res.status(HttpStatus.OK).json(
        successResponse(HttpResponse.OK, {
          dashboardData,
        }),
      );
    } catch (error) {
      next(error);
    }
  };
}
