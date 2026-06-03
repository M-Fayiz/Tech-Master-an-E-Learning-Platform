import { FilterQuery, Types } from "mongoose";
import { courseModel } from "../../models/courses.model";
import { ICourses, ILecture, ISession } from "../../types/courses.type";
import { BaseRepository } from "../baseRepository";
import { ICourseRepository } from "../interface/ICourseRepository";
import logger from "../../config/logger.config";
import { IPopulatedCourse } from "../../types/dtos.type/course.dtos.type";

export class CourseRepository
  extends BaseRepository<ICourses>
  implements ICourseRepository
{
  constructor() {
    super(courseModel);
  }
  async createCourses(courseData: ICourses): Promise<ICourses | null> {
    return await this.create(courseData);
  }
  async fetchCourses(
    limit: number,
    skip: number,
    search?: string,
    category?: Types.ObjectId,
    subcategory?: Types.ObjectId,
    level?: string,
  ): Promise<IPopulatedCourse[] | null> {
    let query: FilterQuery<ICourses> = {};
    if (search) {
      query["title"] = { $regex: search, $options: "i" };
    }
    if (category) {
      query["categoryId"] = category;
    }
    if (subcategory) {
      query["subCategoryId"] = subcategory;
    }
    if (level) {
      query["level"] = level;
    }
    query["status"] = "approved";

    return await this.findAll<IPopulatedCourse>(query, limit, skip, [
      "categoryId",
      "subCategoryId",
    ]);
  }
  async updateCourse(
    courseId: Types.ObjectId,
    courseData: Partial<ICourses>,
  ): Promise<ICourses | null> {
    return await this.findByIDAndUpdate(courseId, courseData);
  }
  async getCourse(courseId: Types.ObjectId): Promise<ICourses | null> {
    return await this.findById(courseId, ["categoryId", "subCategoryId"]);
  }
  async getMentorDraftedCourses(
    search: string,
    limit: number,
    skip: number,
    mentorId: Types.ObjectId,
  ): Promise<IPopulatedCourse[] | null> {
    let query: FilterQuery<ICourses> = {};

    if (search) {
      query["title"] = { $regex: search, $options: "i" };
    }
    query["mentorId"] = mentorId;
    return await this.findAll<IPopulatedCourse>(query, limit, skip, [
      "categoryId",
      "subCategoryId",
    ]);
  }
  async addSession(
    courseId: Types.ObjectId,
    session: ISession,
  ): Promise<ICourses | null> {
    return this.pushToArray({ _id: courseId }, "sessions", session);
  }

  async addLecture(
    courseId: Types.ObjectId,
    sessionId: Types.ObjectId,
    lecture: ILecture,
  ): Promise<ICourses | null> {
    return this.model
      .findOneAndUpdate(
        { _id: courseId, "sessions._id": sessionId },
        { $push: { "sessions.$.lectures": lecture } },
        { new: true },
      )
      .lean<ICourses>()
      .exec();
  }

  async findSession(
    courseId: Types.ObjectId,
    title: string,
  ): Promise<ICourses | null> {
    return await this.findOne({
      _id: courseId,
      "sessions.title": { $regex: title, $options: "i" },
    });
  }
  async findLecture(
    courseId: Types.ObjectId,
    sessionId: Types.ObjectId,
    title: string,
  ): Promise<ICourses | null> {
    return await this.findOne({
      _id: courseId,
      sessions: {
        $elemMatch: {
          _id: sessionId,
          lectures: { $elemMatch: { title: { $regex: title, $options: "i" } } },
        },
      },
    });
  }
  async editLecture(
    courseId: Types.ObjectId,
    sessionId: Types.ObjectId,
    lectureId: Types.ObjectId,
    lecture: ILecture,
  ): Promise<ICourses | null> {
    logger.info("lecture", lecture);
    return await this.findItemAndUpdate(
      { _id: courseId },
      {
        $set: {
          "sessions.$[s].lectures.$[l].title": lecture.title,
          "sessions.$[s].lectures.$[l].lectureType": lecture.lectureType,
          "sessions.$[s].lectures.$[l].lectureContent": lecture.lectureContent,
        },
      },
      {
        new: true,
        arrayFilters: [{ "s._id": sessionId }, { "l._id": lectureId }],
      },
    );
  }
  async updateBaseInfo(
    courseId: Types.ObjectId,
    baseInfo: ICourses,
  ): Promise<ICourses | null> {
    return await this.findByIDAndUpdate(courseId, baseInfo);
  }
  async getAdminCoursList(
    search: string,
    limit: number,
    skip: number,
  ): Promise<IPopulatedCourse[] | null> {
    return await this.findAll<IPopulatedCourse>(
      {
        status: { $in: ["published", "rejected", "approved"] },
        title: { $regex: search ?? "", $options: "i" },
      },
      limit,
      skip,
      ["categoryId", "subCategoryId", "mentorId"],
    );
  }
  async getCourseDetails(
    courseId: Types.ObjectId,
  ): Promise<IPopulatedCourse[] | null> {
    return await this.find<IPopulatedCourse>({ _id: courseId }, [
      "categoryId",
      "subCategoryId",
      "mentorId",
    ]);
  }
  async appproveCourse(courseId: Types.ObjectId): Promise<ICourses | null> {
    return await this.findByIDAndUpdate(courseId, { status: "approved" });
  }
  async rejectCourse(courseId: Types.ObjectId): Promise<ICourses | null> {
    return await this.findByIDAndUpdate(courseId, { status: "rejected" });
  }
  async publishCourse(courseId: Types.ObjectId): Promise<ICourses | null> {
    return await this.findByIDAndUpdate(courseId, { status: "published" });
  }
  async findCourse(courseId: Types.ObjectId): Promise<IPopulatedCourse | null> {
    return await this.findOne<IPopulatedCourse>({ _id: courseId }, [
      "categoryId",
      "subCategoryId",
      "mentorId",
    ]);
  }
  async findDocumentCount(query: FilterQuery<ICourses>): Promise<number> {
    return await this.countDocuments(query);
  }
  async findAllCourse(
    query: FilterQuery<ICourses>,
  ): Promise<ICourses[] | null> {
    return await this.find(query);
  }
  async getCourseFormData(courseId: Types.ObjectId): Promise<ICourses | null> {
    return await this.findOne({ _id: courseId });
  }
  async removeSession(
    courseId: Types.ObjectId,
    sessionId: Types.ObjectId,
  ): Promise<ICourses | null> {
    return this.pullFromArray({ _id: courseId }, "sessions", {
      _id: sessionId,
    });
  }

  async removeLecture(
    courseId: Types.ObjectId,
    sessionId: Types.ObjectId,
    lectureId: Types.ObjectId,
  ): Promise<ICourses | null> {
    return this.model
      .findOneAndUpdate(
        {
          _id: courseId,
          "sessions._id": sessionId,
        },
        {
          $pull: {
            "sessions.$.lectures": { _id: lectureId },
          },
        },
        { new: true },
      )
      .lean<ICourses>()
      .exec();
  }
}
