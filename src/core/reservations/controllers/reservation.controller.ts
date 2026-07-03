import { Request, Response } from "express";
import { ReservationService } from "../services/reservation.service";
import { ReservationStatus } from "../../../utils/reservation.status";

export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  /******************************************************
   ************* @description GET HANDLERS *************
   ******************************************************/

  async getAllReservations(req: Request, res: Response) {
    const { pagination, reservations } =
      await this.reservationService.getAllReservations(req.query);

    res.status(200).json({
      status: "success",
      results: reservations.length,
      pagination,
      data: { reservations },
    });
  }

  async getReservationsByStatus(req: Request, res: Response) {
    const { status } = req.params;
    const reservations = await this.reservationService.getReservationsByStatus(
      status as ReservationStatus,
    );

    res.status(200).json({
      status: "success",
      results: reservations.length,
      data: {
        reservations,
      },
    });
  }

  async getReservationById(req: Request, res: Response) {
    const reservation = await this.reservationService.getReservationById(
      req.params.id,
    );

    res.status(200).json({
      status: "success",
      data: { reservation },
    });
  }

  async getMyReservations(req: Request, res: Response) {
    const reservation = await this.reservationService.getReservationByUserId(
      req.user.id,
    );

    res.status(200).json({
      status: "success",
      data: { reservation },
    });
  }
  /*************************************************************
   ************* @description CREATE OPERATIONS ****************
   *************************************************************/

  async createReservation(req: Request, res: Response) {
    const reservation = await this.reservationService.createReservation(
      req.user.id,
      req.body.ticketId,
      req.body.quantity,
    );
    res.status(201).json({
      status: "success",
      data: { reservation },
    });
  }

  /*************************************************************
   ************* @description PATCH OPERATIONS ****************
   *************************************************************/

  //  TODO : fix payment from zarinpal ,..
  async confirmReservationPayment(req: Request, res: Response) {
    const reservation = await this.reservationService.confirmReservationPayment(
      req.params.id,
    );

    res.status(200).json({
      status: "success",
      data: {
        reservation,
      },
    });
  }

  async cancelReservation(req: Request, res: Response) {
    const reservation = await this.reservationService.cancelReservation(
      req.params.id,
      req.user.id,
    );

    res.status(200).json({
      status: "success",
      data: {
        reservation,
      },
    });
  }

  /*************************************************************
   ************* @description PATCH OPERATIONS ****************
   *************************************************************/

  async deleteReservation(req: Request, res: Response) {
    await this.reservationService.deleteReservation(req.params.id);
    res.status(204).json({
      status: "success",
      data: null,
    });
  }
}
