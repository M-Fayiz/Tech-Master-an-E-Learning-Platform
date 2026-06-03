import { Request, Response, NextFunction } from "express";
import { IUserService } from "../../services/interface/IUserService";
import { IUserController } from "../interface/IUserController";
import { HttpStatus } from "../../const/http-status.const";
import { successResponse } from "../../utils/response.util";
import { HttpResponse } from "../../const/error-message.const";

import { sendNotification } from "../../utils/socket.utils";

export class UserController implements IUserController {
  constructor(private _userService: IUserService) {}

  fetchProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as { _id: string };

      const userData = await this._userService.fetchUser(user._id);

      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { userData }));
    } catch (error) {
      next(error);
    }
  };
  changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user as { _id: string };

      await this._userService.changePassword(
        user._id,
        currentPassword,
        newPassword,
      );
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { changed: true }));
    } catch (error) {
      next(error);
    }
  };

  updateProfileImage = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { imageURL } = req.body;
      const user = req.user as { _id: string };

      const ImageSavedUrl = await this._userService.userProfilePitcureUpdate(
        imageURL,
        user._id,
      );
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { imgURL: ImageSavedUrl }));
    } catch (error) {
      next(error);
    }
  };
  updateUserProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as { _id: string };
      const updatedData = await this._userService.updateUserProfile(
        user._id,
        req.body,
      );
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { updatedData: updatedData }));
    } catch (error) {
      next(error);
    }
  };
  getUserProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { userId } = req.params;
      const userData = await this._userService.getUserProfile(userId);
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { userData }));
    } catch (error) {
      next(error);
    }
  };
  addMentorData = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as { _id: string };
      const userData = req.body;
      const mentorDataAndNotify = await this._userService.addMentorData(
        user._id,
        userData,
      );

      sendNotification(
        mentorDataAndNotify.notificationDTO.userId,
        mentorDataAndNotify.notificationDTO,
      );

      res.status(HttpStatus.OK).json(
        successResponse(HttpResponse.OK, {
          mentorData: mentorDataAndNotify.MentorDtp,
        }),
      );
    } catch (error) {
      next(error);
    }
  };
}
