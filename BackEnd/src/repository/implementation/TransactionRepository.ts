import { FilterQuery, Types, UpdateQuery } from "mongoose";
import {
  ITransactionModel,
  transactionModel,
} from "../../models/transaction.model";
import { ITransaction } from "../../types/transaction.type";
import { BaseRepository } from "../baseRepository";
import { ITransactionRepository } from "../interface/ITransactionRepository";
import { IRevenueAggregationResult } from "../../types/courseDashboard.type";
import { IMentorTotalRevanue } from "../../types/mentorDashboard.types";
import { graphPrps, SourceOfRevanye } from "../../types/adminDahsboard.type";
import { TransactionStatus } from "../../const/transaction.const";

export class TransactionRepositoy
  extends BaseRepository<ITransactionModel>
  implements ITransactionRepository
{
  constructor() {
    super(transactionModel);
  }
  async createTransaction(
    transactionData: ITransaction,
  ): Promise<ITransaction> {
    return this.create(transactionData);
  }
  async getCourseDashboardRevenue(
    courseId: Types.ObjectId,
  ): Promise<IRevenueAggregationResult[]> {
    console.log(courseId);
    return await this.aggregate<IRevenueAggregationResult>([
      { $match: { courseId } },
      {
        $group: {
          _id: null,
          adminSum: { $sum: "$adminShare" },
          mentorSum: { $sum: "$mentorShare" },
        },
      },
    ]);
  }
  async getMentorTotalRevenue(
    mentorId: Types.ObjectId,
    start?: Date,
    end?: Date,
  ): Promise<IMentorTotalRevanue[]> {
    return await this.aggregate<IMentorTotalRevanue>([
      {
        $match: {
          mentorId: mentorId,
          createdAt: { $gte: start, $lte: end },
          status: { $ne: TransactionStatus.REFUNDED },
        },
      },
      {
        $group: {
          _id: "$paymentType",
          revenue: {
            $sum: "$mentorShare",
          },
        },
      },
    ]);
  }
  async getAdminRevenue(start?: Date, end?: Date): Promise<SourceOfRevanye[]> {
    return this.aggregate<SourceOfRevanye>([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $ne: TransactionStatus.REFUNDED },
        },
      },
      {
        $group: {
          _id: "$paymentType",
          value: { $sum: "$adminShare" },
        },
      },
    ]);
  }
  async getMentorRevanueONSlot(
    filter: FilterQuery<ITransactionModel>,
  ): Promise<graphPrps[]> {
    return await this.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          value: { $sum: "$mentorShare" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          value: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);
  }
  async getMentorRevanueONCourse(
    filter: FilterQuery<ITransactionModel>,
  ): Promise<graphPrps[]> {
    return await this.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          value: { $sum: "$mentorShare" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          value: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);
  }
  async findTransaction(
    filter: FilterQuery<ITransactionModel>,
  ): Promise<ITransactionModel | null> {
    return await this.findOne(filter);
  }
  async updateTransaction(
    transactionId: Types.ObjectId,
    updateData: UpdateQuery<ITransactionModel>,
  ): Promise<ITransactionModel | null> {
    return await this.findByIDAndUpdate(transactionId, updateData);
  }
  async getTransactionHistory(
    skip: number,
    limit: number,
  ): Promise<ITransactionModel[] | null> {
    return await this.findAll({}, limit, skip);
  }
  async getTotalTransaction(): Promise<number> {
    return await this.countDocuments();
  }
}
