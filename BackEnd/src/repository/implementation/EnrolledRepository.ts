import { IEnrolledRepository } from "../interface/IEnrolledRepositoy";
import { BaseRepository } from "../baseRepository";
import { EnrolleModel, IEnrolledModel } from "../../models/enrolled.model";
import {
  chartAggregation,
  chartFilter,
  completionStatus,
  IEnrolledAggregation,
  IEnrollement,
} from "../../types/enrollment.types";
import { FilterQuery, Types, UpdateQuery } from "mongoose";
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

export class EnrolledRepository
  extends BaseRepository<IEnrolledModel>
  implements IEnrolledRepository
{
  constructor() {
    super(EnrolleModel);
  }
  async enrolleCourse(
    enrollData: IEnrollement,
  ): Promise<IEnrolledModel | null> {
    return await this.create(enrollData);
  }
  async getEnrolledCourses(
    learnerId: Types.ObjectId,
  ): Promise<IEnrolledModel[] | null> {
    return await this.model
      .find({ learnerId })
      .populate({
        path: "courseId",
        populate: [
          { path: "categoryId" },
          { path: "subCategoryId" },
          { path: "mentorId", select: "name email" },
        ],
      })
      .lean<IEnrolledModel[]>()
      .exec();
  }
  async getEnrolledCOurseDetails(
    enrolledId: Types.ObjectId,
  ): Promise<IEnrolledModel | null> {
    return await this.findById(enrolledId);
  }
  async isEnrolled(
    learnerId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<IEnrolledModel | null> {
    return await this.findOne({ learnerId: learnerId, courseId: courseId });
  }
  async updatedProgress(
  enrolledId: Types.ObjectId,
  lectureId: Types.ObjectId,
): Promise<IEnrolledModel | null> {
  return this.model.findOneAndUpdate(
    { _id: enrolledId },
    {
      $addToSet: {
        "progress.completedLectures": lectureId,
      },
    },
    { new: true },
  ).lean<IEnrolledModel>().exec();
}

  async addRating(
    enrolledId: Types.ObjectId,
    value: number,
  ): Promise<IEnrolledModel | null> {
    return await this.findByIDAndUpdate(enrolledId, { rating: value });
  }
  async getEnrolledDasgboardData(
    courseId: Types.ObjectId,
    mentorId: Types.ObjectId,
  ): Promise<IEnrolledAggregation[] | null> {
    return await this.aggregate<IEnrolledAggregation>([
      { $match: { courseId, mentorId } },
      {
        $group: {
          _id: null,
          avgRating: {
            $avg: "$rating",
          },
          totalStudents: {
            $sum: 1,
          },
        },
      },
    ]);
  }
  async getCourseEnrollmentTrend(
    courseId: Types.ObjectId,
    filterChart: chartFilter,
  ): Promise<chartAggregation[]> {
    return await this.aggregate<chartAggregation>([
      {
        $match: {
          courseId: courseId,
          createdAt: {
            $gte: filterChart.start,
            $lte: filterChart.end,
          },
        },
      },
      {
        $group: {
          _id: {
            day: {
              $dateToString: {
                format: "%Y-%m-%dT00:00:00Z",
                date: "$createdAt",
              },
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.day": 1 } },
    ]);
  }
  async getMentorDashboardData(
    mentorId: Types.ObjectId,
    start?: Date,
    end?: Date,
  ): Promise<IMentorDashboardData[]> {
    return await this.aggregate<IMentorDashboardData>([
      {
        $match: {
          mentorId: mentorId,
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          avgRating: {
            $avg: "$rating",
          },
          totalStudents: {
            $sum: 1,
          },
        },
      },
    ]);
  }
  async getTopSellingCourse(
    mentorId?: Types.ObjectId,
    start?: Date,
    end?: Date,
  ): Promise<ITopCourse[]> {
    const matchStage = mentorId
      ? {
          mentorId,
          createdAt: {
            $gte: start,
            $lte: end,
          },
        }
      : {
          createdAt: {
            $gte: start,
            $lte: end,
          },
        };
    return await this.aggregate<ITopCourse>([
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: "$courseId",
          totalStudent: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          totalStudent: -1,
        },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "course",
        },
      },
      {
        $unwind: "$course",
      },
      {
        $project: {
          courseId: "$course._id",
          title: "$course.title",
          enrolledStudent: "$totalStudent",
        },
      },
    ]);
  }
  async getTopSellingCategory(
    mentorId?: Types.ObjectId,
  ): Promise<ITopCategory[]> {
    const matchStage = mentorId ? { mentorId } : {};
    return await this.aggregate<ITopCategory>([
      {
        $match: {
          mentorId: matchStage,
        },
      },
      {
        $group: {
          _id: "$categoryId",
          totalStudent: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          totalStudent: -1,
        },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: "Category",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $project: {
          courseId: "$_id",
          title: "$category.title",
          enrolledStudent: "$totalStudent",
        },
      },
    ]);
  }
  async getLearnerDashboardCourseData(
    learnerId: Types.ObjectId,
  ): Promise<LearnerCourseCard[]> {
    const result = await this.aggregate<LearnerCourseCard>([
      {
        $match: {
          learnerId: learnerId,
        },
      },
      {
        $group: {
          _id: `$learnerId`,
          courseCount: { $sum: 1 },
          completedCourse: {
            $sum: {
              $cond: [
                { $eq: ["$courseStatus", completionStatus.COMPLETED] },
                1,
                0,
              ],
            },
          },
          inProgressCourse: {
            $sum: {
              $cond: [
                { $eq: ["$courseStatus", completionStatus.IN_PROGRESS] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);
    return result;
  }
  async updateEnrolledData(
    enrolledId: Types.ObjectId,
    data: UpdateQuery<IEnrolledModel>,
  ): Promise<IEnrolledModel | null> {
    return await this.findByIDAndUpdate(enrolledId, data);
  }
  async avgCourseRating(
    courseId: Types.ObjectId,
  ): Promise<CourseDetailsRating[]> {
    return await this.aggregate<CourseDetailsRating>([
      {
        $match: {
          courseId,
        },
      },
      {
        $group: {
          _id: null,
          avgRating: {
            $avg: "$rating",
          },
          totalStudents: {
            $sum: 1,
          },
        },
      },
    ]);
  }
  async getInprogressCourse(
    learnerId: Types.ObjectId,
    populate: string[],
  ): Promise<InProgressCourse[] | null> {
    return await this.find<InProgressCourse>(
      { learnerId, courseStatus: completionStatus.IN_PROGRESS },
      populate,
    );
  }
  async findEnrlloedCourse(filter: FilterQuery<IEnrolledModel>): Promise<IEnrolledModel|null> {
    return await this.findOne(filter)
  }
}
