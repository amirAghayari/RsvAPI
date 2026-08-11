import { Request, Response } from "express";
import { PaymentService } from "../services/payment.service";
import { ICreatePaymentDto } from "../dtos/create-payment.dto";

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /******************************************************
   ************* @description GET HANDLERS **************
   ******************************************************/

  async getAllPayments(req: Request, res: Response) {
    const { pagination, payments } = await this.paymentService.getAllPayments(
      req.query,
    );

    res.status(200).json({
      status: "success",
      results: payments.length,
      pagination,
      data: {
        payments,
      },
    });
  }

  async getPaymentById(req: Request, res: Response) {
    const payment = await this.paymentService.getPaymentById(req.params.id as string);

    res.status(200).json({
      status: "success",
      data: {
        payment,
      },
    });
  }

  async getMyPayments(req: Request, res: Response) {
    const payments = await this.paymentService.getPaymentsByUser(req.user.id);

    res.status(200).json({
      status: "success",
      results: payments.length,
      data: {
        payments,
      },
    });
  }

  /******************************************************
   ************* @description POST HANDLERS *************
   ******************************************************/

  async createPayment(req: Request, res: Response) {
    const result = await this.paymentService.createPayment(
      req.user.id,
      req.body as ICreatePaymentDto,
    );

    res.status(201).json({
      status: "success",
      data: result,
    });
  }

  /******************************************************
   ************* @description VERIFY PAYMENT ************
   ******************************************************/

  async verifyPayment(req: Request, res: Response) {
    const { Authority, Status } = req.query;

    const payment = await this.paymentService.verifyPayment(
      Authority as string,
      Status as string,
    );

    res.status(200).json({
      status: "success",
      data: {
        payment,
      },
    });
  }

  /******************************************************
   ************* @description DELETE HANDLERS ***********
   ******************************************************/

  async deletePayment(req: Request, res: Response) {
    await this.paymentService.deletePayment(req.params.id as string);

    res.status(204).json({
      status: "success",
      data: null,
    });
  }
}
