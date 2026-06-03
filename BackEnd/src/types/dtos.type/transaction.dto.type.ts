import { Types } from "mongoose";
import {
  TransactionStatus,
  TransactionType,
} from "../../const/transaction.const";

export interface ITransactionDTO {
  _id: Types.ObjectId;
  date: Date;
  paymentTypes: TransactionType;
  amount: number;
  share: number;
  mentorShare?: number;
  status: TransactionStatus;
}
