import { TransactionType } from "../const/transaction.const";

export interface IAdminRevenue {
  _id: null;
  revenue: number;
}

export interface graphPrps {
  date: string;
  value: number;
}
export interface SourceOfRevanye {
  _id: TransactionType;
  value: number;
}

export interface Mentorstatus {
  approved: number;
  rejected: number;
}
