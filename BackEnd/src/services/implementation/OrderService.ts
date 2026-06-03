import { IOrderRepository } from "../../repository/interface/IOrderRepository";
import { IOrderService } from "../interface/IOrderService";
import Stripe from "stripe";
import { env } from "../../config/env.config";
import { createHttpError } from "../../utils/http-error";
import { HttpStatus } from "../../const/http-status.const";
import { parseObjectId } from "../../mongoose/objectId";
import { HttpResponse } from "../../const/error-message.const";
import { ICourseRepository } from "../../repository/interface/ICourseRepository";
import { IEnrolledRepository } from "../../repository/interface/IEnrolledRepositoy";
import { completionStatus, IEnrollement } from "../../types/enrollment.types";
import logger from "../../config/logger.config";
import { ITransactionRepository } from "../../repository/interface/ITransactionRepository";
import { ITransaction } from "../../types/transaction.type";
import { calculateShares } from "../../utils/calculateSplit.util";
import {
  OrderStatus,
  PaymentMethod,
  StripeConst,
  TransactionStatus,
  TransactionType,
} from "../../const/transaction.const";
import { stripe } from "../../config/stripe.config";
import { IRole } from "../../types/user.types";
import { ITransactionDTO } from "../../types/dtos.type/transaction.dto.type";
import { transactionHistoryDto } from "../../dtos/transaction.dto";

export class OrderService implements IOrderService {
  constructor(
    private _orderRepository: IOrderRepository,
    private _courseRepository: ICourseRepository,
    private _enrolledRepository: IEnrolledRepository,
    private _transactionRepository: ITransactionRepository,
  ) {}

  /**
   * Handles a course purchase event triggered by the Stripe webhook.
   *
   * 1. Validates and extracts metadata from the Stripe session.
   * 2. Verifies the order and updates its status.
   * 3. Calculates and splits payment shares for admin and mentor.
   * 4. Creates a transaction record.
   * 5. Enrolls the learner into the purchased course.
   * @param session
   * @returns
   */
  async handleCoursePurchase(session: Stripe.Checkout.Session): Promise<void> {
    const metadata = session.metadata!;
    const { orderId, courseId, userId, mentorId, categoryId, amount } =
      metadata;

    const order_id = parseObjectId(orderId);
    const course_id = parseObjectId(courseId);
    const user_id = parseObjectId(userId);
    const mentore_id = parseObjectId(mentorId);
    const category_id = parseObjectId(categoryId);

    if (!order_id || !course_id || !user_id || !mentore_id || !category_id) {
      logger.error(" Invalid ObjectIds in metadata:", session.metadata);
      return;
    }

    const order = await this._orderRepository.findOrder(order_id);

    if (!order) {
      logger.error("Order not found:", order_id);
      return;
    }
    if (order.status === OrderStatus.COMPLETED) {
      logger.warn("Order already completed. Skipping:", order_id);
      return;
    }

    await this._orderRepository.updateOrderStatus(
      order_id,
      OrderStatus.COMPLETED,
    );

    const adminShare = calculateShares(Number(amount), Number(env.ADMIN_SHARE));
    const mentorShare = calculateShares(
      Number(amount),
      Number(env.MENTOR_SHARE),
    );

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    const transactionData: ITransaction = {
      paymentType: TransactionType.COURSE_PURCHASE,
      amount: Number(amount),
      orderId: order_id,
      userId: user_id,
      mentorId: mentore_id,
      status: TransactionStatus.SUCCESS,
      paymentMethod: PaymentMethod.STRIPE,
      gatewayTransactionId: paymentIntentId as string,
      adminShare,
      mentorShare,
      courseId: course_id,
    };

    await this._transactionRepository.createTransaction(transactionData);

    const enrollData: IEnrollement = {
      courseId: course_id,
      categoryId: category_id,
      learnerId: user_id,
      mentorId: mentore_id,
      progress: {
        completedLectures: [],
        completionPercentage: 0,
        lastAccessedLecture: null,
        lastAccessedSession: null,
      },
      courseStatus: completionStatus.IN_PROGRESS,
    };

    await this._enrolledRepository.enrolleCourse(enrollData);
  }
  /**
   *
   * @param userId
   * @param courseId
   * @returns
   */
  async paymentIntent(
    userId: string,
    courseId: string,
  ): Promise<{ clientSecret: string; orderId: string; checkoutURL: string }> {
    const course_id = parseObjectId(courseId);
    const user_Id = parseObjectId(userId);

    if (!course_id || !user_Id) {
      throw createHttpError(HttpStatus.NOT_FOUND, HttpResponse.INVALID_ID);
    }

    const isEnrolled = await this._enrolledRepository.isEnrolled(
      user_Id,
      course_id,
    );

    if (isEnrolled) {
      throw createHttpError(
        HttpStatus.CONFLICT,
        HttpResponse.ALREADY_PURCHASED,
      );
    }

    const existingOrder = await this._orderRepository.isOrdered({
      courseId,
      userId,
    });

    if (existingOrder?.status === OrderStatus.COMPLETED) {
      throw createHttpError(
        HttpStatus.CONFLICT,
        HttpResponse.ALREADY_PURCHASED,
      );
    }

    const course = await this._courseRepository.findCourse(course_id);

    if (!course) {
      throw createHttpError(
        HttpStatus.NOT_FOUND,
        HttpResponse.COURSE_NOT_FOUND,
      );
    }

    const amount = course.price;

    let orderData = existingOrder;

    if (!orderData) {
      orderData = await this._orderRepository.createOrder({
        userId: user_Id,
        courseId: course_id,
        totalAmount: amount,
        status: OrderStatus.PENDING,
      });

      if (!orderData) {
        throw createHttpError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          HttpResponse.SERVER_ERROR,
        );
      }
    }

    if (!stripe) {
      throw createHttpError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpResponse.STRIPR_NOT_AVAILABLE,
      );
    }

    const idemKey = `order_${orderData._id}`;

    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: [StripeConst.payment_method_types],
        line_items: [
          {
            price_data: {
              currency: StripeConst.CURRENCY,
              product_data: {
                name: course.title,
                metadata: {
                  courseId: String(course._id),
                },
              },
              unit_amount: amount * 100,
            },
            quantity: 1,
          },
        ],
        mode: StripeConst.MODE,
        invoice_creation: {
          enabled: true,
        },
        success_url: `${env.CLIENT_URL_2}/${StripeConst.SUCCESS_URL}`,
        client_reference_id: String(orderData._id),
        metadata: {
          paymentType: TransactionType.COURSE_PURCHASE,
          orderId: String(orderData._id),
          courseId,
          userId,
          amount,
          mentorId: String(course.mentorId._id),
          categoryId: String(course.categoryId._id),
        },
      },
      { idempotencyKey: idemKey },
    );

    await this._orderRepository.updateOrder(orderData._id, {
      paymentIntentId: session.id,
    });

    return {
      clientSecret: session.client_secret as string,
      orderId: String(orderData._id),
      checkoutURL: session.url as string,
    };
  }

  async getPaymentData(
    sessionId: string,
  ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    if (!stripe) {
      throw createHttpError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpResponse.STRIPR_NOT_AVAILABLE,
      );
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: [StripeConst.payment_intent, StripeConst.iNVOICE],
    });

    return session;
  }
  async getTransactionHistory(
    role: IRole,
    page: number,
  ): Promise<{ transactionHistory: ITransactionDTO[]; totalPage: number }> {
    let limit = 8;
    let skip = (page - 1) * limit;
    const trasnsactionData =
      await this._transactionRepository.getTransactionHistory(skip, limit);

    const totalPage = await this._transactionRepository.getTotalTransaction();
    if (!trasnsactionData) {
      throw createHttpError(HttpStatus.NOT_FOUND, HttpResponse.ITEM_NOT_FOUND);
    }

    return {
      transactionHistory: trasnsactionData.map((data) =>
        transactionHistoryDto(data, role),
      ),
      totalPage: Math.floor(totalPage / limit),
    };
  }
}
