import { Request, Response, NextFunction } from "express";
import { IOrderController } from "../interface/IOrderController";
import { IOrderService } from "../../services/interface/IOrderService";
import { HttpStatus } from "../../const/http-status.const";
import { HttpResponse } from "../../const/error-message.const";
import { successResponse } from "../../utils/response.util";
import { IRole } from "../../types/user.types";

export class OrderController implements IOrderController {
  constructor(private _orderService: IOrderService) {}

  create_intent = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as { _id: string };
      const { courseId } = req.body;
      const { clientSecret, orderId, checkoutURL } =
        await this._orderService.paymentIntent(user._id, courseId);

      res.status(HttpStatus.OK).json(
        successResponse(HttpResponse.OK, {
          clientSecret,
          orderId,
          checkoutURL,
        }),
      );
    } catch (error) {
      next(error);
    }
  };
  get_payment_data = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const paymentdata = await this._orderService.getPaymentData(id);
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { paymentdata }));
    } catch (error) {
      next(error);
    }
  };
  getTransactionHistory = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as { role: IRole };
      const { page } = req.query;
      const { transactionHistory, totalPage } =
        await this._orderService.getTransactionHistory(user.role, Number(page));

      res
        .status(HttpStatus.OK)
        .json(
          successResponse(HttpResponse.OK, { transactionHistory, totalPage }),
        );
    } catch (error) {
      next(error);
    }
  };
}
