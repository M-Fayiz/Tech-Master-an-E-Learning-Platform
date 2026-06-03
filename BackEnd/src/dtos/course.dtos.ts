import { Types } from "mongoose";

import { ICourses, ISession } from "../types/courses.type";
import {
  ICourseDTO,
  ICourseListDTO,
  IPopulatedCourse,
  IFormCourseDTO,
  IListCourseSlot,
  ICourseCreateForm,
  ICourseDetailsPageDTO,
} from "../types/dtos.type/course.dtos.type";
import { IReviewDTO } from "../types/dtos.type/review.dto.types";

export function courseListDTO(
  course: IPopulatedCourse,
  enrolledIds?: Set<string>,
): ICourseListDTO {
  return {
    _id: course._id,
    title: course.title,
    thumbnail: course.thumbnail,
    category:
      typeof course.categoryId == "object" && "title" in course.categoryId
        ? course.categoryId.title
        : "",
    subCategory:
      typeof course.subCategoryId == "object" && "title" in course.subCategoryId
        ? course.subCategoryId.title
        : "",
    language: course.language,
    level: course.level,
    price: course.price,
    isEnrolled: enrolledIds?.has(String(course._id)) ?? false,
  };
}

export function courseDTO(
  course: IPopulatedCourse,
  isEnrolled?: boolean,
): ICourseDTO {
  return {
    _id: course._id,
    title: course.title,
    description: course.description ? course.description : "",
    thumbnail: course.thumbnail,
    category:
      typeof course.categoryId == "object" && "title" in course.categoryId
        ? course.categoryId.title
        : "",
    subCategory:
      typeof course.subCategoryId == "object" && "title" in course.subCategoryId
        ? course.subCategoryId.title
        : "",
    language: course.language,
    level: course.level,
    price: course.price,
    sessions: course.sessions ? course.sessions : null,
    isEnrolled: isEnrolled ? isEnrolled : false,
  };
}

export function formCourseDto(course: IPopulatedCourse): IFormCourseDTO {
  return {
    _id: course._id,
    title: course.title || "",
    description: course.description || "",
    thumbnail: course.thumbnail || "",
    category: {
      _id: course.categoryId._id,
      title: course.categoryId.title,
    },
    subCategory: {
      _id: course.subCategoryId._id,
      title: course.subCategoryId.title,
    },
    language: course.language,
    level: course.level,
    price: course.price,
    mentorId: {
      _id: course.mentorId._id,
      name: course.mentorId.name,
      email: course.mentorId.email,
    },
    sessions: course.sessions ?? [],
    status: course.status,
    updated: course.updatedAt.toISOString(),
  };
}

export function courseDetailsPageDTO(
  course: IPopulatedCourse,
  courseReview: IReviewDTO[],
  avgRating: number,
  enrolledStd: number,
): ICourseDetailsPageDTO {
  const excludedLecture = course.sessions?.map((session) => ({
    ...session,
    lectures: session.lectures.map(
      ({ lectureContent: _lectureContent, ...rest }) => rest,
    ),
  }));
  console.log("------------", avgRating);
  console.log(courseReview);
  return {
    _id: course._id,
    title: course.title || "",
    description: course.description || "",
    thumbnail: course.thumbnail || "",
    category: {
      _id: course.categoryId._id,
      title: course.categoryId.title,
    },
    subCategory: {
      _id: course.subCategoryId._id,
      title: course.subCategoryId.title,
    },
    language: course.language,
    level: course.level,
    price: course.price,
    mentorId: {
      _id: course.mentorId._id,
      name: course.mentorId.name,
      email: course.mentorId.email,
    },
    sessions: excludedLecture ?? [],
    status: course.status,
    updated: course.updatedAt.toISOString(),
    courseReviews: courseReview,
    avgRating: avgRating ?? 0,
    enrolledStd: enrolledStd,
  };
}

export function listCourseForSLot(course: ICourses): IListCourseSlot {
  return {
    _id: course._id as Types.ObjectId,
    title: course.title,
  };
}

export function CourseFormDataDTO(course: ICourses): ICourseCreateForm {
  return {
    _id: course._id as Types.ObjectId,

    title: course.title,
    language: course.language,
    level: course.level,
    price: course.price,
    status: course.status,
    description: course.description as string,
    thumbnail: course.thumbnail as string,
    categoryId: course.categoryId as Types.ObjectId,
    subCategoryId: course.subCategoryId as Types.ObjectId,
    mentorId: course.mentorId as Types.ObjectId,

    sessions: course.sessions as ISession[],
  };
}
