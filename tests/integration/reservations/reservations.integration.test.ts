import request from "supertest";
import app from "../../../src/app";
import { TestDataSource } from "../../helpers/database";
import { authRequest, authenticateAdmin } from "../../helpers/auth.helper";
import { createEvent } from "../../factories/event.factory";
import { createTicket } from "../../factories/ticket.factory";
import { createUser } from "../../factories/user.factory";

import { Reservation } from "../../../src/core/reservations/reservation.entity";
import { Ticket as TicketEntity } from "../../../src/core/tickets/ticket.entity";
import { EventStatus } from "../../../src/core/events/event.status";
import { ReservationStatus } from "../../../src/core/reservations/reservation.status";

const reservationsUrl = "/api/V1/reservations";

describe("Reservation API - Integration Tests", () => {
  describe("POST /api/V1/reservations", () => {
    it("should create a new reservation successfully and reduce ticket capacity", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
        status: EventStatus.PUBLISHED,
        startsAt: new Date(Date.now() + 100000),
        endsAt: new Date(Date.now() + 200000),
      });

      const ticket = await createTicket({
        eventId: event.id,
        price: 150,
        capacity: 20,
        reservedCount: 5,
        maxPerUser: 3,
        saleStartsAt: new Date(),
        saleEndsAt: new Date(Date.now() + 200000),
      });

      const res = await request(app)
        .post(reservationsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          ticketId: ticket.id,
          quantity: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.reservation).toBeDefined();
      expect(res.body.data.reservation.ticketId).toBe(ticket.id);
      expect(res.body.data.reservation.userId).toBe(user.user.id);
      expect(res.body.data.reservation.quantity).toBe(2);
      expect(res.body.data.reservation.status).toBe(ReservationStatus.PENDING);

      // Verify ticket capacity was reduced
      const updatedTicket = await TestDataSource.getRepository(TicketEntity).findOne({
        where: { id: ticket.id },
      });

      expect(updatedTicket).not.toBeNull();
      expect(updatedTicket!.reservedCount).toBe(7); // 5 + 2
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await request(app).post(reservationsUrl).send({
        ticketId: "db92fd1d-6b87-45d5-9622-d0af7cf55322",
        quantity: 1,
      });

      expect(res.status).toBe(401);
    });

    it("should return 404 if ticket not found", async () => {
      const user = await authRequest();

      const fakeTicketId = "db92fd1d-6b87-45d5-9622-d0af7cf55322";

      const res = await request(app)
        .post(reservationsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          ticketId: fakeTicketId,
          quantity: 1,
        });

      expect(res.status).toBe(404);
    });

    it("should return 400 if quantity is less than or equal to zero", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
        status: EventStatus.PUBLISHED,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      const res = await request(app)
        .post(reservationsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          ticketId: ticket.id,
          quantity: 0,
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 if quantity exceeds maxPerUser", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
        status: EventStatus.PUBLISHED,
      });

      const ticket = await createTicket({
        eventId: event.id,
        maxPerUser: 2,
      });

      const res = await request(app)
        .post(reservationsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          ticketId: ticket.id,
          quantity: 5,
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 if not enough ticket capacity available", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
        status: EventStatus.PUBLISHED,
      });

      const ticket = await createTicket({
        eventId: event.id,
        capacity: 10,
        reservedCount: 8,
      });

      const res = await request(app)
        .post(reservationsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          ticketId: ticket.id,
          quantity: 5,
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 if event is not published", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
        status: EventStatus.DRAFT,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      const res = await request(app)
        .post(reservationsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          ticketId: ticket.id,
          quantity: 1,
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 if ticket sale has not started yet", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
        status: EventStatus.PUBLISHED,
      });

      const ticket = await createTicket({
        eventId: event.id,
        saleStartsAt: new Date(Date.now() + 100000),
        saleEndsAt: new Date(Date.now() + 200000),
      });

      const res = await request(app)
        .post(reservationsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          ticketId: ticket.id,
          quantity: 1,
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 if ticket sale has ended", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
        status: EventStatus.PUBLISHED,
      });

      const ticket = await createTicket({
        eventId: event.id,
        saleStartsAt: new Date(Date.now() - 200000),
        saleEndsAt: new Date(Date.now() - 100000),
      });

      const res = await request(app)
        .post(reservationsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          ticketId: ticket.id,
          quantity: 1,
        });

      expect(res.status).toBe(400);
    });

    it("should return 409 if user already has a pending reservation for the same ticket", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
        status: EventStatus.PUBLISHED,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      // Create first reservation
      const firstRes = await request(app)
        .post(reservationsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          ticketId: ticket.id,
          quantity: 1,
        });

      expect(firstRes.status).toBe(201);

      // Try to create second reservation for same ticket
      const secondRes = await request(app)
        .post(reservationsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          ticketId: ticket.id,
          quantity: 1,
        });

      expect(secondRes.status).toBe(409);
    });

    it("should set expiresAt to 15 minutes from now", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
        status: EventStatus.PUBLISHED,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      const beforeCreate = new Date();

      const res = await request(app)
        .post(reservationsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          ticketId: ticket.id,
          quantity: 1,
        });

      expect(res.status).toBe(201);

      const expiresAt = new Date(res.body.data.reservation.expiresAt);
      const expectedExpiresAt = new Date(beforeCreate.getTime() + 15 * 60 * 1000);

      // Allow 2 seconds tolerance
      expect(Math.abs(expiresAt.getTime() - expectedExpiresAt.getTime())).toBeLessThan(2000);
    });
  });

  describe("GET /api/V1/reservations/me", () => {
    it("should return current user's reservations", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
        status: EventStatus.PUBLISHED,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      // Create a reservation
      await request(app)
        .post(reservationsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          ticketId: ticket.id,
          quantity: 1,
        });

      const res = await request(app)
        .get(`${reservationsUrl}/me`)
        .set("Authorization", `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.reservation).toBeDefined();
      expect(Array.isArray(res.body.data.reservation)).toBe(true);
      expect(res.body.data.reservation.length).toBeGreaterThanOrEqual(1);
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await request(app).get(`${reservationsUrl}/me`);

      expect(res.status).toBe(401);
    });

    it("should return only the authenticated user's reservations", async () => {
      const user1 = await authRequest();
      const user2 = await authRequest();

      const event = await createEvent({
        userId: user1.user.id,
        status: EventStatus.PUBLISHED,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      // User1 creates a reservation
      await request(app)
        .post(reservationsUrl)
        .set("Authorization", `Bearer ${user1.accessToken}`)
        .send({
          ticketId: ticket.id,
          quantity: 1,
        });

      // User2 creates a reservation
      await request(app)
        .post(reservationsUrl)
        .set("Authorization", `Bearer ${user2.accessToken}`)
        .send({
          ticketId: ticket.id,
          quantity: 1,
        });

      // Check user1's reservations
      const res1 = await request(app)
        .get(`${reservationsUrl}/me`)
        .set("Authorization", `Bearer ${user1.accessToken}`);

      expect(res1.status).toBe(200);
      expect(res1.body.data.reservation.length).toBe(1);
      expect(res1.body.data.reservation[0].userId).toBe(user1.user.id);

      // Check user2's reservations
      const res2 = await request(app)
        .get(`${reservationsUrl}/me`)
        .set("Authorization", `Bearer ${user2.accessToken}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.reservation.length).toBe(1);
      expect(res2.body.data.reservation[0].userId).toBe(user2.user.id);
    });
  });

  describe("GET /api/V1/reservations/:id", () => {
    it("should return reservation details by id", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
        status: EventStatus.PUBLISHED,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      // Create a reservation
      const createRes = await request(app)
        .post(reservationsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          ticketId: ticket.id,
          quantity: 2,
        });

      const reservationId = createRes.body.data.reservation.id;

      const res = await request(app)
        .get(`${reservationsUrl}/${reservationId}`)
        .set("Authorization", `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.reservation.id).toBe(reservationId);
      expect(res.body.data.reservation.quantity).toBe(2);
    });

    it("should return 404 if reservation not found", async () => {
      const admin = await authenticateAdmin();

      const fakeId = "db92fd1d-6b87-45d5-9622-d0af7cf55322";

      const res = await request(app)
        .get(`${reservationsUrl}/${fakeId}`)
        .set("Authorization", `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await request(app).get(`${reservationsUrl}/db92fd1d-6b87-45d5-9622-d0af7cf55322`);

      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /api/V1/reservations/:id/cancel", () => {
    it("should cancel a pending reservation successfully and release ticket capacity", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
        status: EventStatus.PUBLISHED,
      });

      const ticket = await createTicket({
        eventId: event.id,
        capacity: 20,
        reservedCount: 5,
      });

      // Create a reservation
      const createRes = await request(app)
        .post(reservationsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          ticketId: ticket.id,
          quantity: 3,
        });

      const reservationId = createRes.body.data.reservation.id;

      // Verify reservedCount was increased
      let updatedTicket = await TestDataSource.getRepository(TicketEntity).findOne({
        where: { id: ticket.id },
      });
      expect(updatedTicket!.reservedCount).toBe(8); // 5 + 3

      // Cancel the reservation
      const cancelRes = await request(app)
        .patch(`${reservationsUrl}/${reservationId}/cancel`)
        .set("Authorization", `Bearer ${user.accessToken}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.status).toBe("success");
      expect(cancelRes.body.data.reservation.status).toBe(ReservationStatus.CANCELED);

      // Verify ticket capacity was released
      updatedTicket = await TestDataSource.getRepository(TicketEntity).findOne({
        where: { id: ticket.id },
      });
      expect(updatedTicket!.reservedCount).toBe(5); // 8 - 3
    });

    it("should return 400 if reservation is already canceled", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
        status: EventStatus.PUBLISHED,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      // Create a reservation
      const createRes = await request(app)
        .post(reservationsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          ticketId: ticket.id,
          quantity: 1,
        });

      const reservationId = createRes.body.data.reservation.id;

      // Cancel once
      await request(app)
        .patch(`${reservationsUrl}/${reservationId}/cancel`)
        .set("Authorization", `Bearer ${user.accessToken}`);

      // Try to cancel again
      const secondCancel = await request(app)
        .patch(`${reservationsUrl}/${reservationId}/cancel`)
        .set("Authorization", `Bearer ${user.accessToken}`);

      expect(secondCancel.status).toBe(400);
    });

    it("should return 400 if reservation is already confirmed (paid)", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
        status: EventStatus.PUBLISHED,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      // Create a confirmed reservation directly in DB
      const reservation = await TestDataSource.getRepository(Reservation).save({
        userId: user.user.id,
        ticketId: ticket.id,
        quantity: 1,
        status: ReservationStatus.CONFIRMED,
        expiresAt: new Date(Date.now() + 100000),
      });

      const res = await request(app)
        .patch(`${reservationsUrl}/${reservation.id}/cancel`)
        .set("Authorization", `Bearer ${user.accessToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 400 if user tries to cancel another user's reservation", async () => {
      const owner = await authRequest();
      const attacker = await authRequest();

      const event = await createEvent({
        userId: owner.user.id,
        status: EventStatus.PUBLISHED,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      // Owner creates a reservation
      const createRes = await request(app)
        .post(reservationsUrl)
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .send({
          ticketId: ticket.id,
          quantity: 1,
        });

      const reservationId = createRes.body.data.reservation.id;

      // Attacker tries to cancel
      const cancelRes = await request(app)
        .patch(`${reservationsUrl}/${reservationId}/cancel`)
        .set("Authorization", `Bearer ${attacker.accessToken}`);

      expect(cancelRes.status).toBe(400);
    });

    it("should return 404 if reservation not found", async () => {
      const user = await authRequest();

      const fakeId = "db92fd1d-6b87-45d5-9622-d0af7cf55322";

      const res = await request(app)
        .patch(`${reservationsUrl}/${fakeId}/cancel`)
        .set("Authorization", `Bearer ${user.accessToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await request(app).patch(`${reservationsUrl}/db92fd1d-6b87-45d5-9622-d0af7cf55322/cancel`);

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/V1/reservations/ (Admin)", () => {
    it("should return all reservations for admin", async () => {
      const admin = await authenticateAdmin();

      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
        status: EventStatus.PUBLISHED,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      // Create a reservation
      await request(app)
        .post(reservationsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          ticketId: ticket.id,
          quantity: 1,
        });

      const res = await request(app)
        .get(reservationsUrl)
        .set("Authorization", `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.results).toBeGreaterThanOrEqual(1);
      expect(res.body.data.reservations).toBeDefined();
    });

    it("should return 403 if non-admin user tries to access all reservations", async () => {
      const user = await authRequest();

      const res = await request(app)
        .get(reservationsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`);

      expect(res.status).toBe(403);
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await request(app).get(reservationsUrl);

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/V1/reservations/status/:status (Admin)", () => {
    it("should return reservations filtered by status", async () => {
      const admin = await authenticateAdmin();

      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
        status: EventStatus.PUBLISHED,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      // Create a pending reservation
      await request(app)
        .post(reservationsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          ticketId: ticket.id,
          quantity: 1,
        });

      const res = await request(app)
        .get(`${reservationsUrl}/status/pending`)
        .set("Authorization", `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.reservations).toBeDefined();
      expect(Array.isArray(res.body.data.reservations)).toBe(true);
    });

    it("should return 403 if non-admin user tries to access reservations by status", async () => {
      const user = await authRequest();

      const res = await request(app)
        .get(`${reservationsUrl}/status/pending`)
        .set("Authorization", `Bearer ${user.accessToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/V1/reservations/:id (Admin)", () => {
    it("should delete a reservation successfully", async () => {
      const admin = await authenticateAdmin();

      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
        status: EventStatus.PUBLISHED,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      // Create a reservation
      const createRes = await request(app)
        .post(reservationsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          ticketId: ticket.id,
          quantity: 1,
        });

      const reservationId = createRes.body.data.reservation.id;

      const res = await request(app)
        .delete(`${reservationsUrl}/${reservationId}`)
        .set("Authorization", `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(204);

      // Verify reservation is deleted
      const deletedReservation = await TestDataSource.getRepository(Reservation).findOne({
        where: { id: reservationId },
      });
      expect(deletedReservation).toBeNull();
    });

    it("should return 404 if reservation not found", async () => {
      const admin = await authenticateAdmin();

      const fakeId = "db92fd1d-6b87-45d5-9622-d0af7cf55322";

      const res = await request(app)
        .delete(`${reservationsUrl}/${fakeId}`)
        .set("Authorization", `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 403 if non-admin user tries to delete a reservation", async () => {
      const user = await authRequest();

      const res = await request(app)
        .delete(`${reservationsUrl}/db92fd1d-6b87-45d5-9622-d0af7cf55322`)
        .set("Authorization", `Bearer ${user.accessToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("Concurrency Tests", () => {
    it("should handle concurrent reservations for limited capacity correctly", async () => {
      const user1 = await authRequest();
      const user2 = await authRequest();

      const event = await createEvent({
        userId: user1.user.id,
        status: EventStatus.PUBLISHED,
      });

      // Create a ticket with only 1 capacity left
      const ticket = await createTicket({
        eventId: event.id,
        capacity: 10,
        reservedCount: 9,
        maxPerUser: 1,
      });

      // Both users try to reserve at the same time
      const [res1, res2] = await Promise.all([
        request(app)
          .post(reservationsUrl)
          .set("Authorization", `Bearer ${user1.accessToken}`)
          .send({ ticketId: ticket.id, quantity: 1 }),
        request(app)
          .post(reservationsUrl)
          .set("Authorization", `Bearer ${user2.accessToken}`)
          .send({ ticketId: ticket.id, quantity: 1 }),
      ]);

      // One should succeed and one should fail
      const successCount = [res1.status, res2.status].filter((s) => s === 201).length;
      const failCount = [res1.status, res2.status].filter((s) => s === 400).length;

      expect(successCount).toBe(1);
      expect(failCount).toBe(1);

      // Verify final reservedCount is 10
      const updatedTicket = await TestDataSource.getRepository(TicketEntity).findOne({
        where: { id: ticket.id },
      });
      expect(updatedTicket!.reservedCount).toBe(10);
    });
  });

  describe("Integration: Reservation -> Payment Flow", () => {
    it("should confirm reservation after successful payment", async () => {
      jest.mock("axios");
      const axios = require("axios");
      const mockedAxios = axios as jest.Mocked<typeof axios>;

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
        status: EventStatus.PUBLISHED,
      });

      const ticket = await createTicket({
        eventId: event.id,
        price: 200,
      });

      // Create reservation
      const createRes = await request(app)
        .post(reservationsUrl)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          ticketId: ticket.id,
          quantity: 1,
        });

      const reservationId = createRes.body.data.reservation.id;

      // Verify reservation is PENDING
      expect(createRes.body.data.reservation.status).toBe(ReservationStatus.PENDING);

      // Create payment
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            authority: "AUTH_PAYMENT",
          },
        },
      } as any);

      const createPaymentRes = await request(app)
        .post("/api/V1/payments")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          reservationId: reservationId,
        });

      expect(createPaymentRes.status).toBe(201);

      // Mock verification response
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

      // Verify payment
      const verifyRes = await request(app).get(
        `/api/V1/payments/verify?Authority=AUTH_PAYMENT&Status=OK`
      );

      expect(verifyRes.status).toBe(200);

      // Verify reservation is now CONFIRMED
      const updatedReservation = await TestDataSource.getRepository(Reservation).findOne({
        where: { id: reservationId },
      });

      expect(updatedReservation).not.toBeNull();
      expect(updatedReservation!.status).toBe(ReservationStatus.CONFIRMED);
    });
  });
});
