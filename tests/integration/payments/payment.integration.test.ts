import request from "supertest";
import axios from "axios";

import app from "../../../src/app";

import { createEvent } from "../../factories/event.factory";
import { createTicket } from "../../factories/ticket.factory";
import { createReservation } from "../../factories/reservation.factory";
import { createPayment, paymentsUrl } from "../../factories/payment.factory";

import { TestDataSource } from "../../helpers/database";

import { Payment } from "../../../src/core/payments/payment.entity";
import { PaymentStatus } from "../../../src/core/payments/payment.status";
import { ReservationStatus } from "../../../src/core/reservations/reservation.status";
import { authenticateAdmin, authRequest } from "../../helpers/auth.helper";
import { Reservation } from "../../../src/core/reservations/reservation.entity";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Payment API", () => {
  describe("POST /api/V1/payments", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should create payment successfully", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            authority: "AUTH_123456",
          },
        },
      } as any);

      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
      });

      const ticket = await createTicket({
        eventId: event.id,
        price: 250,
      });

      const reservation = await createReservation({
        userId: user.user.id,
        ticketId: ticket.id,
        quantity: 2,
        expiresAt: new Date(Date.now() + 1000 * 60 * 10),
      });

      const res = await request(app)
        .post(paymentsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          reservationId: reservation.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.paymentUrl).toContain("AUTH_123456");

      const payment = await TestDataSource.getRepository(Payment).findOne({
        where: {
          reservationId: reservation.id,
        },
      });

      expect(payment).not.toBeNull();

      expect(payment!.status).toBe(PaymentStatus.PENDING);

      expect(payment!.authority).toBe("AUTH_123456");

      expect(Number(payment!.amount)).toBe(500);

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await request(app).post(paymentsUrl).send({
        reservationId: "db92fd1d-6b87-45d5-9622-d0af7cf55322",
      });

      expect(res.status).toBe(401);
    });

    it("should return 404 if reservation not found", async () => {
      const user = await authRequest();

      const res = await request(app)
        .post(paymentsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          reservationId: "db92fd1d-6b87-45d5-9622-d0af7cf55322",
        });

      expect(res.status).toBe(404);
    });

    it("should return 400 if reservation has expired", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      const reservation = await createReservation({
        ticketId: ticket.id,
        userId: user.user.id,
        expiresAt: new Date(Date.now() - 5000),
      });

      const res = await request(app)
        .post(paymentsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          reservationId: reservation.id,
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 if reservation already confirmed", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      const reservation = await createReservation({
        ticketId: ticket.id,
        userId: user.user.id,
        status: ReservationStatus.CONFIRMED,
      });

      const res = await request(app)
        .post(paymentsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          reservationId: reservation.id,
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 if reservation canceled", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      const reservation = await createReservation({
        ticketId: ticket.id,
        userId: user.user.id,
        status: ReservationStatus.CANCELED,
      });

      const res = await request(app)
        .post(paymentsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          reservationId: reservation.id,
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 if reservation expired status", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      const reservation = await createReservation({
        ticketId: ticket.id,
        userId: user.user.id,
        status: ReservationStatus.EXPIRED,
      });

      const res = await request(app)
        .post(paymentsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          reservationId: reservation.id,
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 when reservation belongs to another user", async () => {
      const owner = await authRequest();
      const attacker = await authRequest();

      const event = await createEvent({
        userId: owner.user.id,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      const reservation = await createReservation({
        ticketId: ticket.id,
        userId: owner.user.id,
      });

      const res = await request(app)
        .post(paymentsUrl)
        .set("Authorization", `Bearer ${attacker.accessToken}`)
        .send({
          reservationId: reservation.id,
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 if pending payment already exists", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      const reservation = await createReservation({
        ticketId: ticket.id,
        userId: user.user.id,
      });

      await createPayment({
        reservationId: reservation.id,
        userId: user.user.id,
        amount: ticket.price,
        status: PaymentStatus.PENDING,
      });

      const res = await request(app)
        .post(paymentsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          reservationId: reservation.id,
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 when validation fails", async () => {
      const user = await authRequest();

      const res = await request(app)
        .post(paymentsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          reservationId: "invalid-id",
        });

      expect(res.status).toBe(400);
    });
  });
  describe("GET /api/V1/payments/me", () => {
    it("should return current user payments", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      const reservation = await createReservation({
        ticketId: ticket.id,
        userId: user.user.id,
      });

      await createPayment({
        reservationId: reservation.id,
        userId: user.user.id,
        amount: ticket.price,
      });

      const res = await request(app)
        .get(`${paymentsUrl}/me`)
        .set("Authorization", `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.results).toBe(1);
      expect(res.body.data.payments).toHaveLength(1);

      expect(res.body.data.payments[0].userId).toBe(user.user.id);
    });

    it("should return empty array when user has no payments", async () => {
      const user = await authRequest();

      const res = await request(app)
        .get(`${paymentsUrl}/me`)
        .set("Authorization", `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);

      expect(res.body.results).toBe(0);

      expect(res.body.data.payments).toEqual([]);
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await request(app).get(`${paymentsUrl}/me`);

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/V1/payments", () => {
    it("should return all payments for admin", async () => {
      const admin = await authenticateAdmin();

      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      const reservation = await createReservation({
        ticketId: ticket.id,
        userId: user.user.id,
      });

      await createPayment({
        reservationId: reservation.id,
        userId: user.user.id,
        amount: ticket.price,
      });

      const res = await request(app)
        .get(paymentsUrl)
        .set("Authorization", `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);

      expect(res.body.status).toBe("success");

      expect(res.body.results).toBe(1);

      expect(res.body.data.payments).toHaveLength(1);
    });

    it("should return 404 when page does not exist", async () => {
      const admin = await authenticateAdmin();

      const res = await request(app)
        .get(`${paymentsUrl}?page=100&limit=10`)
        .set("Authorization", `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 403 if authenticated user is not admin", async () => {
      const user = await authRequest();

      const res = await request(app)
        .get(paymentsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`);

      expect(res.status).toBe(403);
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await request(app).get(paymentsUrl);

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/V1/payments/:id", () => {
    it("should return payment by id", async () => {
      const admin = await authenticateAdmin();

      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      const reservation = await createReservation({
        ticketId: ticket.id,
        userId: user.user.id,
      });

      const payment = await createPayment({
        reservationId: reservation.id,
        userId: user.user.id,
        amount: ticket.price,
      });

      const res = await request(app)
        .get(`${paymentsUrl}/${payment.id}`)
        .set("Authorization", `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);

      expect(res.body.data.payment.id).toBe(payment.id);
    });

    it("should return 404 if payment not found", async () => {
      const admin = await authenticateAdmin();

      const res = await request(app)
        .get(`${paymentsUrl}/6fda5287-6f2d-4f4d-b865-71dd0f9ef340`)
        .set("Authorization", `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 400 when id is invalid", async () => {
      const admin = await authenticateAdmin();

      const res = await request(app)
        .get(`${paymentsUrl}/invalid-id`)
        .set("Authorization", `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 403 if user is not admin", async () => {
      const user = await authRequest();

      const res = await request(app)
        .get(`${paymentsUrl}/6fda5287-6f2d-4f4d-b865-71dd0f9ef340`)
        .set("Authorization", `Bearer ${user.accessToken}`);

      expect(res.status).toBe(403);
    });
  });
  describe("GET /api/V1/payments/verify", () => {
    it("should verify payment successfully", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            ref_id: 12345678,
            card_pan: "603799******1111",
            fee: 0,
            fee_type: "Merchant",
          },
        },
      } as any);

      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
      });

      const ticket = await createTicket({
        eventId: event.id,
        price: 300,
      });

      const reservation = await createReservation({
        userId: user.user.id,
        ticketId: ticket.id,
      });

      const payment = await createPayment({
        reservationId: reservation.id,
        userId: user.user.id,
        amount: 300,
        authority: "AUTH_VERIFY",
      });

      const res = await request(app).get(
        `${paymentsUrl}/verify?Authority=AUTH_VERIFY&Status=OK`,
      );

      console.error(res.body);
      expect(res.status).toBe(200);

      expect(res.body.status).toBe("success");

      const updatedPayment = await TestDataSource.getRepository(
        Payment,
      ).findOne({
        where: {
          id: payment.id,
        },
      });

      expect(updatedPayment).not.toBeNull();

      expect(updatedPayment!.status).toBe(PaymentStatus.SUCCESS);

      expect(updatedPayment!.refId).toBe("12345678");

      expect(updatedPayment!.cardPan).toBe("603799******1111");

      expect(updatedPayment!.paidAt).not.toBeNull();

      const updatedReservation = await TestDataSource.getRepository(
        Reservation,
      ).findOne({
        where: {
          id: reservation.id,
        },
      });

      expect(updatedReservation!.status).toBe(ReservationStatus.CONFIRMED);
    });

    it("should return existing payment if already verified", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      const reservation = await createReservation({
        userId: user.user.id,
        ticketId: ticket.id,
      });

      const payment = await createPayment({
        reservationId: reservation.id,
        userId: user.user.id,
        amount: 100,
        authority: "AUTH_SUCCESS",
        status: PaymentStatus.SUCCESS,
      });

      const res = await request(app).get(
        `${paymentsUrl}/verify?Authority=AUTH_SUCCESS&Status=OK`,
      );

      expect(res.status).toBe(200);

      expect(res.body.data.payment.id).toBe(payment.id);

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it("should mark payment as failed when gateway verification fails", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          errors: {
            message: "failed",
          },
        },
      } as any);

      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      const reservation = await createReservation({
        ticketId: ticket.id,
        userId: user.user.id,
      });

      const payment = await createPayment({
        reservationId: reservation.id,
        userId: user.user.id,
        authority: "AUTH_FAIL",
        amount: 100,
      });

      const res = await request(app).get(
        `${paymentsUrl}/verify?Authority=AUTH_FAIL&Status=OK`,
      );

      expect(res.status).toBe(200);

      const updated = await TestDataSource.getRepository(Payment).findOne({
        where: {
          id: payment.id,
        },
      });

      expect(updated!.status).toBe(PaymentStatus.FAILED);
    });

    it("should return 400 when payment canceled by user", async () => {
      const res = await request(app).get(
        `${paymentsUrl}/verify?Authority=AUTH123&Status=NOK`,
      );

      expect(res.status).toBe(400);
    });

    it("should return 404 when payment not found", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            ref_id: 123,
          },
        },
      } as any);

      const res = await request(app).get(
        `${paymentsUrl}/verify?Authority=NOT_FOUND&Status=OK`,
      );

      expect(res.status).toBe(404);
    });

    it("should return 400 when Authority is missing", async () => {
      const res = await request(app).get(`${paymentsUrl}/verify?Status=OK`);

      expect(res.status).toBe(400);
    });

    it("should return 400 when Status is invalid", async () => {
      const res = await request(app).get(
        `${paymentsUrl}/verify?Authority=AUTH123&Status=INVALID`,
      );

      expect(res.status).toBe(400);
    });
  });
  describe("DELETE /api/V1/payments/:id", () => {
    it("should delete payment successfully", async () => {
      const admin = await authenticateAdmin();

      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      const reservation = await createReservation({
        ticketId: ticket.id,
        userId: user.user.id,
      });

      const payment = await createPayment({
        reservationId: reservation.id,
        userId: user.user.id,
        amount: ticket.price,
      });

      const res = await request(app)
        .delete(`${paymentsUrl}/${payment.id}`)
        .set("Authorization", `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(204);

      const deleted = await TestDataSource.getRepository(Payment).findOne({
        where: {
          id: payment.id,
        },
      });

      expect(deleted).toBeNull();
    });

    it("should return 404 if payment not found", async () => {
      const admin = await authenticateAdmin();

      const res = await request(app)
        .delete(`${paymentsUrl}/7e5c07fe-fdcb-4f44-bf67-06e2c7c1985b`)
        .set("Authorization", `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 400 when id is invalid", async () => {
      const admin = await authenticateAdmin();

      const res = await request(app)
        .delete(`${paymentsUrl}/invalid-id`)
        .set("Authorization", `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 403 if authenticated user is not admin", async () => {
      const user = await authRequest();

      const res = await request(app)
        .delete(`${paymentsUrl}/7e5c07fe-fdcb-4f44-bf67-06e2c7c1985b`)
        .set("Authorization", `Bearer ${user.accessToken}`);

      expect(res.status).toBe(403);
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await request(app).delete(
        `${paymentsUrl}/7e5c07fe-fdcb-4f44-bf67-06e2c7c1985b`,
      );

      expect(res.status).toBe(401);
    });
  });
});
