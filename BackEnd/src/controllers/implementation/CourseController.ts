import { Request, Response, NextFunction } from "express";
import { ICourseService } from "../../services/interface/ICourseService";
import { ICourseController } from "../interface/ICourseController";
import { HttpStatus } from "../../const/http-status.const";
import { successResponse } from "../../utils/response.util";
import { HttpResponse } from "../../const/error-message.const";
import { updatePart } from "../../types/courses.type";

import { sendNotification } from "../../utils/socket.utils";
import { IAnyUser, IUser } from "../../types/user.types";

export class CourseController implements ICourseController {
  constructor(private _courseService: ICourseService) {}

  addCourse = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const createdCourseData = await this._courseService.createCourses(
        req.body.courseData,
      );

      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { createdCourseData }));
    } catch (error) {
      next(error);
    }
  };
  updateCourse = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const courseId = req.params.id;
      const updatedPart = req.query.course_part;
      const courseData = req.body;
      console.log(courseId, updatedPart, courseData);
      const updatedCourseData = await this._courseService.updateCourseData(
        courseId,
        courseData,
        updatedPart as updatePart,
      );
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { updatedCourseData }));
    } catch (error) {
      next(error);
    }
  };
  fetchCourse = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const {
        search,
        category,
        subcategory,
        level,
        page = 1,
        limit = 1,
        learnerId,
      } = req.query;

      const { courseData, totalPage } = await this._courseService.fetchCourses(
        Number(page || 1),
        Number(limit || 6),
        search as string,
        category as string,
        subcategory as string,
        level as string,
        learnerId as string,
      );

      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { courseData, totalPage }));
    } catch (error) {
      next(error);
    }
  };
  getCourse = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { courseId } = req.params;
      const { learnerId } = req.query;

      const { courseDetails, enrolledId } = await this._courseService.getCourse(
        courseId,
        learnerId as string,
      );

      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { courseDetails, enrolledId }));
    } catch (error) {
      next(error);
    }
  };
  getMentorDraftedCourseList = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { mentorId, search, page } = req.query;
      console.log("mentor Id : ", mentorId);
      const draftCoursList = await this._courseService.getDraftedCourses(
        search as string,
        page as string,
        mentorId as string,
      );

      res.status(HttpStatus.OK).json(
        successResponse(HttpResponse.OK, {
          courseData: draftCoursList?.courseData,
          totalPage: draftCoursList?.totalPage,
        }),
      );
    } catch (error) {
      next(error);
    }
  };
  addSession = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { courseId } = req.params;
      const { session } = req.body;

      const addedSessionData = await this._courseService.addSessions(
        courseId,
        session,
      );

      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { addedSessionData }));
    } catch (error) {
      next(error);
    }
  };
  addLecture = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { courseId, sessionId } = req.params;
      const { lecture } = req.body;

      const addedLectureData = await this._courseService.addLectures(
        courseId,
        sessionId as string,
        lecture,
      );
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { addedLectureData }));
    } catch (error) {
      next(error);
    }
  };
  editLecture = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { courseId, lectureId, sessionId } = req.params;

      const { lecture } = req.body;

      const updatedData = await this._courseService.editLecture(
        courseId,
        sessionId,
        lectureId,
        lecture,
      );

      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { updatedData }));
    } catch (error) {
      next(error);
    }
  };
  updateBaseInfo = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { courseId } = req.params;
      const { courseData } = req.body;
      const updatedData = await this._courseService.updateBaseCourseInfo(
        courseId,
        courseData,
      );
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { updatedData }));
    } catch (error) {
      next(error);
    }
  };
  getAdminCoursList = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { search, page } = req.query;
      const coursList = await this._courseService.getAdminCourse(
        search as string,
        Number(page),
      );
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { coursList }));
    } catch (error) {
      next(error);
    }
  };
  getCourseDetails = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { courseId } = req.params;

      const courseDetails =
        await this._courseService.getCourseDetails(courseId);
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { courseDetails }));
    } catch (error) {
      next(error);
    }
  };
  approveCourse = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { courseId } = req.params;
      const status = await this._courseService.approveCourse(courseId);
      sendNotification(status.notifyDTO.userId, status.notifyDTO);
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { status: status.status }));
    } catch (error) {
      next(error);
    }
  };
  rejectCourse = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { courseId } = req.params;
      const { feedBack, email } = req.body;

      const status = await this._courseService.rejectCourse(
        courseId,
        feedBack,
        email,
      );

      sendNotification(status.notifyDTO.userId, status.notifyDTO);
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { status }));
    } catch (error) {
      next(error);
    }
  };
  publishCourse = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { courseId } = req.params;
      const status = await this._courseService.publishCourse(courseId);
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { status }));
    } catch (error) {
      next(error);
    }
  };
  getCourseListSlot = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as { _id: string };
      const courseList = await this._courseService.fetchCourseListForSlot(
        user._id,
      );
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { courseList }));
    } catch (error) {
      next(error);
    }
  };
  getCourseFormData = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { courseId } = req.params;
      const user = req.user as IAnyUser;

      const courseFormData = await this._courseService.getCourseFormData(
        courseId,
        user as IUser,
      );
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { courseFormData }));
    } catch (error) {
      next(error);
    }
  };
  removeSession = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { courseId, sessionId } = req.params;
      console.log(courseId, "-    -", sessionId);
      const removedSessionData = await this._courseService.removeSession(
        courseId,
        sessionId,
      );
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { removedSessionData }));
    } catch (error) {
      next(error);
    }
  };
  getAdminCourseDetails = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { courseId } = req.params;
      const courseDetails =
        await this._courseService.getAdminCourseDetails(courseId);
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { courseDetails }));
    } catch (error) {
      next(error);
    }
  };
}
