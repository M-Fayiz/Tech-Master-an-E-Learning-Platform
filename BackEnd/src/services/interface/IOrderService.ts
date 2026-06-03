import Stripe from "stripe";
import { IRole } from "../../types/user.types";
import { ITransactionDTO } from "../../types/dtos.type/transaction.dto.type";
export interface IOrderService {
  paymentIntent(
    userId: string,
    courseId: string,
  ): Promise<{ clientSecret: string; orderId: string; checkoutURL: string }>;
  getPaymentData(
    sessionId: string,
  ): Promise<Stripe.Response<Stripe.Checkout.Session>>;
  handleCoursePurchase(session: Stripe.Checkout.Session): Promise<void>;
  getTransactionHistory(
    role: IRole,
    page: number,
  ): Promise<{ transactionHistory: ITransactionDTO[]; totalPage: number }>;
}
