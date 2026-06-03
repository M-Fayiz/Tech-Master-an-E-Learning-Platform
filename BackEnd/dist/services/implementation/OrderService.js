"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const env_config_1 = require("../../config/env.config");
const http_error_1 = require("../../utils/http-error");
const http_status_const_1 = require("../../const/http-status.const");
const objectId_1 = require("../../mongoose/objectId");
const error_message_const_1 = require("../../const/error-message.const");
const enrollment_types_1 = require("../../types/enrollment.types");
const logger_config_1 = __importDefault(require("../../config/logger.config"));
const calculateSplit_util_1 = require("../../utils/calculateSplit.util");
const transaction_const_1 = require("../../const/transaction.const");
const stripe_config_1 = require("../../config/stripe.config");
const transaction_dto_1 = require("../../dtos/transaction.dto");
class OrderService {
    constructor(_orderRepository, _courseRepository, _enrolledRepository, _transactionRepository) {
        this._orderRepository = _orderRepository;
        this._courseRepository = _courseRepository;
        this._enrolledRepository = _enrolledRepository;
        this._transactionRepository = _transactionRepository;
    }
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
    async handleCoursePurchase(session) {
        const metadata = session.metadata;
        const { orderId, courseId, userId, mentorId, categoryId, amount } = metadata;
        const order_id = (0, objectId_1.parseObjectId)(orderId);
        const course_id = (0, objectId_1.parseObjectId)(courseId);
        const user_id = (0, objectId_1.parseObjectId)(userId);
        const mentore_id = (0, objectId_1.parseObjectId)(mentorId);
        const category_id = (0, objectId_1.parseObjectId)(categoryId);
        if (!order_id || !course_id || !user_id || !mentore_id || !category_id) {
            logger_config_1.default.error(" Invalid ObjectIds in metadata:", session.metadata);
            return;
        }
        const order = await this._orderRepository.findOrder(order_id);
        if (!order) {
            logger_config_1.default.error("Order not found:", order_id);
            return;
        }
        if (order.status === transaction_const_1.OrderStatus.COMPLETED) {
            logger_config_1.default.warn("Order already completed. Skipping:", order_id);
            return;
        }
        await this._orderRepository.updateOrderStatus(order_id, transaction_const_1.OrderStatus.COMPLETED);
        const adminShare = (0, calculateSplit_util_1.calculateShares)(Number(amount), Number(env_config_1.env.ADMIN_SHARE));
        const mentorShare = (0, calculateSplit_util_1.calculateShares)(Number(amount), Number(env_config_1.env.MENTOR_SHARE));
        const paymentIntentId = typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;
        const transactionData = {
            paymentType: transaction_const_1.TransactionType.COURSE_PURCHASE,
            amount: Number(amount),
            orderId: order_id,
            userId: user_id,
            mentorId: mentore_id,
            status: transaction_const_1.TransactionStatus.SUCCESS,
            paymentMethod: transaction_const_1.PaymentMethod.STRIPE,
            gatewayTransactionId: paymentIntentId,
            adminShare,
            mentorShare,
            courseId: course_id,
        };
        await this._transactionRepository.createTransaction(transactionData);
        const enrollData = {
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
            courseStatus: enrollment_types_1.completionStatus.IN_PROGRESS,
        };
        await this._enrolledRepository.enrolleCourse(enrollData);
    }
    /**
     *
     * @param userId
     * @param courseId
     * @returns
     */
    async paymentIntent(userId, courseId) {
        const course_id = (0, objectId_1.parseObjectId)(courseId);
        const user_Id = (0, objectId_1.parseObjectId)(userId);
        if (!course_id || !user_Id) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.NOT_FOUND, error_message_const_1.HttpResponse.INVALID_ID);
        }
        const isEnrolled = await this._enrolledRepository.isEnrolled(user_Id, course_id);
        if (isEnrolled) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.CONFLICT, error_message_const_1.HttpResponse.ALREADY_PURCHASED);
        }
        const existingOrder = await this._orderRepository.isOrdered({
            courseId,
            userId,
        });
        if (existingOrder?.status === transaction_const_1.OrderStatus.COMPLETED) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.CONFLICT, error_message_const_1.HttpResponse.ALREADY_PURCHASED);
        }
        const course = await this._courseRepository.findCourse(course_id);
        if (!course) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.NOT_FOUND, error_message_const_1.HttpResponse.COURSE_NOT_FOUND);
        }
        const amount = course.price;
        let orderData = existingOrder;
        if (!orderData) {
            orderData = await this._orderRepository.createOrder({
                userId: user_Id,
                courseId: course_id,
                totalAmount: amount,
                status: transaction_const_1.OrderStatus.PENDING,
            });
            if (!orderData) {
                throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.INTERNAL_SERVER_ERROR, error_message_const_1.HttpResponse.SERVER_ERROR);
            }
        }
        if (!stripe_config_1.stripe) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.INTERNAL_SERVER_ERROR, error_message_const_1.HttpResponse.STRIPR_NOT_AVAILABLE);
        }
        const idemKey = `order_${orderData._id}`;
        const session = await stripe_config_1.stripe.checkout.sessions.create({
            payment_method_types: [transaction_const_1.StripeConst.payment_method_types],
            line_items: [
                {
                    price_data: {
                        currency: transaction_const_1.StripeConst.CURRENCY,
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
            mode: transaction_const_1.StripeConst.MODE,
            invoice_creation: {
                enabled: true,
            },
            success_url: `${env_config_1.env.CLIENT_URL_2}/${transaction_const_1.StripeConst.SUCCESS_URL}`,
            client_reference_id: String(orderData._id),
            metadata: {
                paymentType: transaction_const_1.TransactionType.COURSE_PURCHASE,
                orderId: String(orderData._id),
                courseId,
                userId,
                amount,
                mentorId: String(course.mentorId._id),
                categoryId: String(course.categoryId._id),
            },
        }, { idempotencyKey: idemKey });
        await this._orderRepository.updateOrder(orderData._id, {
            paymentIntentId: session.id,
        });
        return {
            clientSecret: session.client_secret,
            orderId: String(orderData._id),
            checkoutURL: session.url,
        };
    }
    async getPaymentData(sessionId) {
        if (!stripe_config_1.stripe) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.INTERNAL_SERVER_ERROR, error_message_const_1.HttpResponse.STRIPR_NOT_AVAILABLE);
        }
        const session = await stripe_config_1.stripe.checkout.sessions.retrieve(sessionId, {
            expand: [transaction_const_1.StripeConst.payment_intent, transaction_const_1.StripeConst.iNVOICE],
        });
        return session;
    }
    async getTransactionHistory(role, page) {
        let limit = 8;
        let skip = (page - 1) * limit;
        const trasnsactionData = await this._transactionRepository.getTransactionHistory(skip, limit);
        const totalPage = await this._transactionRepository.getTotalTransaction();
        if (!trasnsactionData) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.NOT_FOUND, error_message_const_1.HttpResponse.ITEM_NOT_FOUND);
        }
        return {
            transactionHistory: trasnsactionData.map((data) => (0, transaction_dto_1.transactionHistoryDto)(data, role)),
            totalPage: Math.floor(totalPage / limit),
        };
    }
}
exports.OrderService = OrderService;
