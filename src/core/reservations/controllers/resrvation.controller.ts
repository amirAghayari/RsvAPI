import { Request, Response } from "express";
import { ReservationService } from "../services/reservation.service";
import { ReservationStatus } from "../../../utils/reservation.status";

export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  /******************************************************
   ************* @description GET HANDLERS *************
   ******************************************************/

  async getAllReservation(req: Request, res: Response) {
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

  async getReservationByUserId(req: Request, res: Response) {
    const userId = req.user.id || req.params.id;

    const reservation =
      await this.reservationService.getReservationByUserId(userId);

    res.status(200).json({
      status: "success",
      data: { reservation },
    });
  }

  async getReservationByEventId(req: Request, res: Response) {
    const reservation = await this.reservationService.getReservationByUserId(
      req.params.id,
    );

    res.status(200).json({
      status: "success",
      data: { reservation },
    });
  }

  async getReservationByUserAndEventId(req: Request, res: Response) {
    const { userId, eventId } = req.params;

    const reservation =
      await this.reservationService.getReservationByUserAndEventId(
        userId,
        eventId,
      );

    res.status(200).json({
      status: "success",
      data: { reservation },
    });
  }

  async getReservationCountByEvent(req: Request, res: Response) {
    const count = await this.reservationService.reservationCountByEvent(
      req.params.id,
    );

    res.status(200).json({
      status: "success",
      count: count,
    });
  }

  async reservationExists(req: Request, res: Response) {
    const { userId, eventId } = req.params;
    const exists = await this.reservationService.reservationIsExists(
      userId,
      eventId,
    );

    res.status(200).json({
      status: "success",
      exists: exists,
    });
  }

  /*************************************************************
   ************* @description CREATE OPERATIONS ****************
   *************************************************************/

  async createReservation(req: Request, res: Response) {
    const reservation = await this.reservationService.createReservation(
      req.user.id,
      req.params.id,
    );
    res.status(201).json({
      status: "success",
      data: { reservation },
    });
  }

  /*************************************************************
   ************* @description PATCH OPERATIONS ****************
   *************************************************************/

  async updateReservationStatus(req: Request, res: Response) {
    const reservation = await this.reservationService.updateReservationStatus(
      req.params.id,
      req.body.status as ReservationStatus,
    );
    res.status(201).json({
      status: "success",
      data: { reservation },
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
