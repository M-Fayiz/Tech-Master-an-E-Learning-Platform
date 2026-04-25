import { Types } from "mongoose";
import { IPayloadDTO } from "../types/dtos.type/user.dto.types";
import { IAnyUser } from "../types/user.types";

export const payloadDTO = (
  user: IAnyUser,
  sessionId?: Types.ObjectId,
): IPayloadDTO => {
  return {
    _id: user._id,
    email: user.email,
    role: user.role,
    sessionId,
  };
};
