import { parseObjectId } from "../../mongoose/objectId";
import { ICategoryRepository } from "../../repository/interface/ICategoryRepository";
import { ICourseRepository } from "../../repository/interface/ICourseRepository";
import { ICourses, ILecture, ISession } from "../../types/courses.type";
import { ICourseService } from "../interface/ICourseService";

import {
  ICourseDTO,
  ICourseListDTO,
  IPopulatedCourse,
  IFormCourseDTO,
  IListCourseSlot,
  ICourseCreateForm,
  ICourseDetailsPageDTO,
} from "../../types/dtos.type/course.dtos.type";
import {
  courseDetailsPageDTO,
  courseDTO,
  CourseFormDataDTO,
  courseListDTO,
  formCourseDto,
  listCourseForSLot,
} from "../../dtos/course.dtos";
import { createHttpError } from "../../utils/http-error";
import { HttpStatus } from "../../const/http-status.const";
import { HttpResponse } from "../../const/error-message.const";
import { sendMail } from "../../utils/send-mail.util";
import { FilterQuery, Types } from "mongoose";
import { IEnrolledRepository } from "../../repository/interface/IEnrolledRepositoy";
import { INotificationRepository } from "../../repository/interface/INotificationRepository";
import { NotificationTemplates } from "../../template/notification.template";
import { INotificationDTO } from "../../types/dtos.type/notification.dto.types";
import { notificationDto } from "../../dtos/notification.dto";
import { IReviewRepository } from "../../repository/interface/IReviewRepository";
import { popularedReviewDTO } from "../../dtos/review.dto";
import { IReviewPopulatedDTO } from "../../types/dtos.type/review.dto.types";
import { IUser } from "../../types/user.types";

export class CourseService implements ICourseService {
  constructor(
    private _courseRepository: ICourseRepository,
    private _categoryRepository: ICategoryRepository,
    private _enrolledRepository: IEnrolledRepository,
    private _notificationRepository: INotificationRepository,
    private _reviewRepository: IReviewRepository,
  ) {}

  async createCourses(course: ICourses): Promise<ICourseCreateForm | null> {
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
      throw createHttpError(HttpStatus.CONFLICT, HttpResponse.ITEM_EXIST);
    }

    const createdCourse = await this._courseRepository.createCourses(course);
    return CourseFormDataDTO(createdCourse as ICourses);
  }

  async fetchCourses(
    page: number,
    limit: number,
    search?: string,
    category?: string,
    subcategory?: string,
    level?: string,
    learnerId?: string,
  ): Promise<{ courseData: ICourseListDTO[] | null; totalPage: number }> {
    let category_Id;
    let subCategory_id;
    let learner_Id;

    if (category) {
      category_Id = parseObjectId(category);
    }
    if (subcategory) {
      subCategory_id = parseObjectId(subcategory);
    }
    if (learnerId) {
      learner_Id = parseObjectId(learnerId);
    }
    let skip = (page - 1) * limit;
    let query: FilterQuery<ICourses> = {};
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
      this._courseRepository.fetchCourses(
        limit,
        skip,
        search,
        category_Id as Types.ObjectId,
        subCategory_id as Types.ObjectId,
        level,
      ),
      this._courseRepository.findDocumentCount(query),
    ]);
    let enrolledCourse;
    if (learner_Id) {
      enrolledCourse =
        await this._enrolledRepository.getEnrolledCourses(learner_Id);
    }
    if (!courseList) {
      throw createHttpError(HttpStatus.NOT_FOUND, HttpResponse.ITEM_NOT_FOUND);
    }
    const enrolledIds = new Set(
      enrolledCourse?.map((c) =>
        String((c.courseId as { _id?: Types.ObjectId })._id ?? c.courseId),
      ),
    );
    const mappedCourseList = courseList.map((course) =>
      courseListDTO(course as IPopulatedCourse, enrolledIds),
    );
    let totalPage = totalDocument / limit;
    return { courseData: mappedCourseList, totalPage };
  }
  async updateCourseData(
    courseId: string,
    courseData: Partial<ICourses> | ISession | ILecture,
    courseUpdatePart: "sessions" | "lecture" | "baseInformation",
  ): Promise<ICourses | null> {
    const Id = parseObjectId(courseId);
    console.log("udate course", Id);
    if (!Id) {
      throw createHttpError(HttpStatus.BAD_REQUEST, HttpResponse.INVALID_ID);
    }
    switch (courseUpdatePart) {
      case "sessions":
        return await this._courseRepository.addSession(
          Id,
          courseData as ISession,
        );
    }

    return null;
  }
  async getCourse(
    courseId: string,
    learnerId?: string,
  ): Promise<{
    courseDetails: ICourseDetailsPageDTO;
    enrolledId: Types.ObjectId | null;
  }> {
    const course_id = parseObjectId(courseId);
    if (!course_id) {
      throw createHttpError(HttpStatus.BAD_REQUEST, HttpResponse.INVALID_ID);
    }

    const learner_id = learnerId ? parseObjectId(learnerId) : null;

    const [courseData, reviews, summery] = await Promise.all([
      this._courseRepository.getCourseDetails(course_id),
      this._reviewRepository.getCourseReview(course_id),
      this._enrolledRepository.avgCourseRating(course_id),
    ]);

    const mappedReview = reviews
      ? reviews?.map((review) =>
          popularedReviewDTO(review as IReviewPopulatedDTO),
        )
      : [];
    if (!courseData || courseData.length === 0) {
      throw createHttpError(HttpStatus.NOT_FOUND, HttpResponse.ITEM_NOT_FOUND);
    }
    let isEnrolled: Types.ObjectId | null = null;

    if (learner_id) {
      const data = await this._enrolledRepository.isEnrolled(
        learner_id,
        course_id,
      );

      if (data) {
        isEnrolled = data._id;
      }
    }
    const avgRating = summery?.[0]?.avgRating ?? 0;
    const totalStudents = summery?.[0]?.totalStudents ?? 0;

    return {
      courseDetails: courseDetailsPageDTO(
        courseData[0],
        mappedReview,
        avgRating,
        totalStudents,
      ),
      enrolledId: isEnrolled,
    };
  }

  async getDraftedCourses(
    search: string,
    page: string,
    mentorId: string,
  ): Promise<{ courseData: IFormCourseDTO[]; totalPage: number } | null> {
    const id = parseObjectId(mentorId);
    if (!id) {
      throw createHttpError(HttpStatus.OK, HttpResponse.INVALID_ID);
    }
    let limit = 6;
    let skip = (Number(page) - 1) * limit;
    let query: FilterQuery<ICourses> = {};
    if (search) {
      query["title"] = { $regex: search, $options: "i" };
    }

    query["mentorId"] = mentorId;

    const [courseData, documnetCount] = await Promise.all([
      this._courseRepository.getMentorDraftedCourses(search, limit, skip, id),
      this._courseRepository.findDocumentCount(query),
    ]);

    const mappedCourseList = courseData?.map((course) =>
      formCourseDto(course as IPopulatedCourse),
    );
    let totalPage = Math.floor(documnetCount / limit);
    console.log(totalPage);
    return mappedCourseList
      ? { courseData: mappedCourseList, totalPage: totalPage }
      : null;
  }

  async addSessions(courseId: string, session: ISession): Promise<ICourseDTO> {
    const id = parseObjectId(courseId);

    if (!id) {
      throw createHttpError(HttpStatus.BAD_REQUEST, HttpResponse.INVALID_ID);
    }
    const isExist = await this._courseRepository.findSession(id, session.title);
    if (isExist) {
      throw createHttpError(HttpStatus.CONFLICT, HttpResponse.ITEM_EXIST);
    }
    await this._courseRepository.addSession(id, session);
    const courseData = await this._courseRepository.findCourse(id);
    if (!courseData) {
      throw createHttpError(
        HttpStatus.NOT_FOUND,
        HttpResponse.COURSE_NOT_FOUND,
      );
    }
    return courseDTO(courseData as unknown as IPopulatedCourse);
  }
  async addLectures(
    courseId: string,
    sessionId: string,
    lecture: ILecture,
  ): Promise<ICourseDTO> {
    const CourseId = parseObjectId(courseId);
    const SessionId = parseObjectId(sessionId);
    if (!CourseId || !SessionId) {
      throw createHttpError(HttpStatus.BAD_REQUEST, HttpResponse.INVALID_ID);
    }
    const isExist = await this._courseRepository.findLecture(
      CourseId,
      SessionId,
      lecture.title,
    );
    if (isExist) {
      throw createHttpError(HttpStatus.CONFLICT, HttpResponse.ITEM_EXIST);
    }
    await this._courseRepository.addLecture(CourseId, SessionId, lecture);
    const courseData = await this._courseRepository.findCourse(CourseId);
    return courseDTO(courseData as IPopulatedCourse);
  }
  async editLecture(
    courseId: string,
    sessionId: string,
    lectureId: string,
    lecture: ILecture,
  ): Promise<ICourseDTO> {
    const CourseId = parseObjectId(courseId);
    const SessionId = parseObjectId(sessionId);
    const LectureId = parseObjectId(lectureId);
    if (!CourseId || !SessionId || !LectureId) {
      throw createHttpError(HttpStatus.BAD_REQUEST, HttpResponse.INVALID_ID);
    }

    await this._courseRepository.editLecture(
      CourseId,
      SessionId,
      LectureId,
      lecture,
    );
    const coursedata = await this._courseRepository.findCourse(CourseId);
    if (!coursedata) {
      throw createHttpError(
        HttpStatus.NOT_FOUND,
        HttpResponse.COURSE_NOT_FOUND,
      );
    }

    return courseDTO(coursedata as unknown as IPopulatedCourse);
  }
  async updateBaseCourseInfo(
    courseId: string,
    baseInfo: ICourses,
  ): Promise<ICourseDTO> {
    const id = parseObjectId(courseId);

    if (!id) {
      throw createHttpError(HttpStatus.BAD_REQUEST, HttpResponse.INVALID_ID);
    }
    await this._courseRepository.updateBaseInfo(id, baseInfo);
    const courseData = await this._courseRepository.findCourse(id);

    return courseDTO(courseData as unknown as IPopulatedCourse);
  }
  async getAdminCourse(
    search: string,
    page: number,
  ): Promise<IFormCourseDTO[] | null> {
    const limit = 4;
    const skip = (page - 1) * limit;
    const adminCoursList = await this._courseRepository.getAdminCoursList(
      search,
      limit,
      skip,
    );

    return adminCoursList
      ? adminCoursList.map((course) =>
          formCourseDto(course as IPopulatedCourse),
        )
      : null;
  }
  async getCourseDetails(courseId: string): Promise<IFormCourseDTO | null> {
    const id = parseObjectId(courseId);
    if (!id) {
      throw createHttpError(HttpStatus.BAD_REQUEST, HttpResponse.INVALID_ID);
    }
    const courseDetails = await this._courseRepository.getCourseDetails(id);
    return courseDetails ? formCourseDto(courseDetails[0]) : null;
  }
  async approveCourse(courseId: string): Promise<{
    status: string | null;
    notifyDTO: INotificationDTO;
  }> {
    const course_id = parseObjectId(courseId);
    if (!course_id) {
      throw createHttpError(HttpStatus.BAD_REQUEST, HttpResponse.INVALID_ID);
    }

    const courseDetails =
      await this._courseRepository.appproveCourse(course_id);

    const notifyData = NotificationTemplates.courseApproval(
      courseDetails?.mentorId as Types.ObjectId,
      courseDetails?.title as string,
    );
    const savedNotify =
      await this._notificationRepository.createNotification(notifyData);
    const notifyDTO = notificationDto(savedNotify);
    return {
      status: courseDetails?.status ? courseDetails?.status : null,
      notifyDTO,
    };
  }
  async rejectCourse(
    courseId: string,
    feedBack: string,
    email: string,
  ): Promise<{ courseStatus: string | null; notifyDTO: INotificationDTO }> {
    const id = parseObjectId(courseId);
    if (!id) {
      throw createHttpError(HttpStatus.BAD_REQUEST, HttpResponse.INVALID_ID);
    }
    const courseDetails = await this._courseRepository.rejectCourse(id);
    const notifyData = NotificationTemplates.courseRejection(
      courseDetails?.mentorId as Types.ObjectId,
      courseDetails?.title as string,
      feedBack,
    );
    const savedNotify =
      await this._notificationRepository.createNotification(notifyData);
    const notifyDTO = notificationDto(savedNotify);

    if (courseDetails?.status == "rejected") {
      await sendMail(email, "Feedback On Your Course", feedBack);
    }
    return {
      courseStatus: courseDetails ? courseDetails.status : null,
      notifyDTO,
    };
  }
  async publishCourse(courseId: string): Promise<string | null> {
    const id = parseObjectId(courseId);
    if (!id) {
      throw createHttpError(HttpStatus.BAD_REQUEST, HttpResponse.INVALID_ID);
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
  async fetchCourseListForSlot(
    mentorId: string,
  ): Promise<IListCourseSlot[] | null> {
    const mentor_Id = parseObjectId(mentorId);

    const courseList = await this._courseRepository.findAllCourse({
      mentorId: mentor_Id,
    });
    if (!courseList) {
      throw createHttpError(
        HttpStatus.NOT_FOUND,
        HttpResponse.COURSE_NOT_FOUND,
      );
    }

    return courseList.map((course) => listCourseForSLot(course));
  }
  async getCourseFormData(
    courseId: string,
    user: IUser,
  ): Promise<ICourseCreateForm> {
    const course_Id = parseObjectId(courseId);
    if (!course_Id) {
      throw createHttpError(HttpStatus.BAD_REQUEST, HttpResponse.INVALID_ID);
    }

    const courseFormData =
      await this._courseRepository.getCourseFormData(course_Id);
    console.log(courseFormData?.mentorId, " < > ", user._id);
    if (!courseFormData) {
      throw createHttpError(
        HttpStatus.NOT_FOUND,
        HttpResponse.COURSE_NOT_FOUND,
      );
    }
    if (courseFormData.mentorId.toString() !== user._id.toString()) {
      throw createHttpError(HttpStatus.FORBIDDEN, HttpResponse.ACCESS_DENIED);
    }

    if (!courseFormData) {
      throw createHttpError(
        HttpStatus.NOT_FOUND,
        HttpResponse.COURSE_NOT_FOUND,
      );
    }

    return CourseFormDataDTO(courseFormData);
  }
  async removeSession(
    courseId: string,
    sessionId: string,
  ): Promise<ICourseCreateForm | null> {
    const course_id = parseObjectId(courseId);
    const session_id = parseObjectId(sessionId);
    if (!course_id || !session_id) {
      throw createHttpError(HttpStatus.BAD_REQUEST, HttpResponse.INVALID_ID);
    }

    const removedData = await this._courseRepository.removeSession(
      course_id,
      session_id,
    );
    return CourseFormDataDTO(removedData as ICourses);
  }
  async getAdminCourseDetails(courseId: string): Promise<IFormCourseDTO> {
    const course_id = parseObjectId(courseId);
    if (!course_id) {
      throw createHttpError(HttpStatus.BAD_REQUEST, HttpResponse.INVALID_ID);
    }

    const courseData = await this._courseRepository.getCourseDetails(course_id);

    if (!courseData || courseData.length === 0) {
      throw createHttpError(HttpStatus.NOT_FOUND, HttpResponse.ITEM_NOT_FOUND);
    }
    return formCourseDto(courseData[0]);
  }
}
