import { ITransactionModel } from "../models/transaction.model";
import { ITransactionDTO } from "../types/dtos.type/transaction.dto.type";
import { IRole } from "../types/user.types";

export function transactionHistoryDto(
  data: ITransactionModel,
  role: IRole,
): ITransactionDTO {
  return {
    _id: data._id,
    amount: data.amount,
    date: data.createdAt as Date,
    paymentTypes: data.paymentType,
    status: data.status,
    mentorShare: role == IRole.Admin ? data.mentorShare : 0,
    share: role == IRole.Admin ? data.adminShare : data.mentorShare,
  };
}
