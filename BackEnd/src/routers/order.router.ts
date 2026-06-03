import express from "express";
const orderRouter = express.Router();

import { OrderRepositoy } from "../repository/implementation/OrderRepository";
import { OrderController } from "../controllers/implementation/OrderController";
import { OrderService } from "../services/implementation/OrderService";
import { CourseRepository } from "../repository/implementation/CourseRepository";
import { EnrolledRepository } from "../repository/implementation/EnrolledRepository";
import { verifyUser } from "../middlewares/authentication.middleware";
import { authorizedRole } from "../middlewares/authorisation.middleware";
import { TransactionRepositoy } from "../repository/implementation/TransactionRepository";
import { IRole } from "../types/user.types";
const transactionRepository = new TransactionRepositoy();
const orderRepository = new OrderRepositoy();
const courseRepository = new CourseRepository();
const enrolledRepository = new EnrolledRepository();
const orderService = new OrderService(
  orderRepository,
  courseRepository,
  enrolledRepository,
  transactionRepository,
);

const orderController = new OrderController(orderService);

orderRouter.get(
  "/stripe/:id",
  verifyUser,
  authorizedRole(IRole.Learner),
  orderController.get_payment_data,
);
orderRouter.get(
  "/payment/transaction",
  verifyUser,
  authorizedRole(IRole.Admin, IRole.Mentor),
  orderController.getTransactionHistory,
);

orderRouter.post(
  "/payment/create-checkout-session",
  verifyUser,
  authorizedRole(IRole.Learner),
  orderController.create_intent,
);

export default orderRouter;
