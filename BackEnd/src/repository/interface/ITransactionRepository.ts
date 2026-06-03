import { FilterQuery, Types, UpdateQuery } from "mongoose";
import { ITransaction } from "../../types/transaction.type";
import { IRevenueAggregationResult } from "../../types/courseDashboard.type";
import { IMentorTotalRevanue } from "../../types/mentorDashboard.types";
import { ITransactionModel } from "../../models/transaction.model";
import { graphPrps, SourceOfRevanye } from "../../types/adminDahsboard.type";

export interface ITransactionRepository {
  createTransaction(transactionData: ITransaction): Promise<ITransaction>;
  getCourseDashboardRevenue(
    courseId: Types.ObjectId,
  ): Promise<IRevenueAggregationResult[]>;
  getMentorTotalRevenue(
    mentorId: Types.ObjectId,
    start?: Date,
    end?: Date,
  ): Promise<IMentorTotalRevanue[]>;
  getMentorRevanueONSlot(
    filter: FilterQuery<ITransactionModel>,
  ): Promise<graphPrps[]>;
  getMentorRevanueONCourse(
    filter: FilterQuery<ITransactionModel>,
  ): Promise<graphPrps[]>;
  getAdminRevenue(start?: Date, end?: Date): Promise<SourceOfRevanye[]>;
  findTransaction(
    filter: FilterQuery<ITransactionModel>,
  ): Promise<ITransactionModel | null>;
  updateTransaction(
    transactionId: Types.ObjectId,
    updateData: UpdateQuery<ITransactionModel>,
  ): Promise<ITransactionModel | null>;
  getTransactionHistory(
    skip: number,
    limit: number,
  ): Promise<ITransactionModel[] | null>;
  getTotalTransaction(): Promise<number>;
}
