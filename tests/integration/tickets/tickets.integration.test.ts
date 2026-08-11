import app from "../../../src/app";
import { createEvent } from "../../factories/event.factory";
import { createTicket, ticketsUrl } from "../../factories/ticket.factory";
import request from "supertest";
import { createUser } from "../../factories/user.factory";
import { EventStatus } from "../../../src/core/events/event.status";
import { authRequest } from "../../helpers/auth.helper";
describe("Ticket API", () => {
  describe("Get /api/V1/tickets/:id", () => {
    it("it should return ticket with status 200", async () => {
      const user = await createUser();
      const event = await createEvent({
        userId: user.id,
        status: EventStatus.PUBLISHED,
      });
      const ticket = await createTicket({
        eventId: event.id,
      });
      const res = await request(app).get(`${ticketsUrl}/${ticket.id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.ticket).toBeDefined();
    });
    it("it should return 400 if event not published yet", async () => {
      const user = await createUser();
      const event = await createEvent({
        userId: user.id,
      });
      const ticket = await createTicket({
        eventId: event.id,
      });
      const res = await request(app).get(`${ticketsUrl}/${ticket.id}`);

      expect(res.statusCode).toBe(400);
    });
    it("it should return 404 if ticket not found", async () => {
      const fakeId = "9838e0ea-97f9-468e-bd9f-a4bf7c951da7";
      const res = await request(app).get(`${ticketsUrl}/${fakeId}`);

      expect(res.statusCode).toBe(404);
    });
  });
  describe("PATCH /api/V1/tickets/:id", () => {
    it("should update ticket successfully", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
        status: EventStatus.PUBLISHED,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      const res = await request(app)
        .patch(`${ticketsUrl}/${ticket.id}`)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          title: "Updated Title",
          description: "Updated Description",
          price: 300,
          capacity: 30,
          maxPerUser: 4,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.updatedTicket.title).toBe("Updated Title");
      expect(res.body.data.updatedTicket.price).toBe(300);
    });

    it("should return 401 if user is not authenticated", async () => {
      const owner = await authRequest();

      const event = await createEvent({
        userId: owner.user.id,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      const res = await request(app).patch(`${ticketsUrl}/${ticket.id}`).send({
        title: "Updated",
      });

      expect(res.status).toBe(401);
    });

    it("should return 403 if authenticated user is not owner", async () => {
      const owner = await authRequest();
      const anotherUser = await authRequest();

      const event = await createEvent({
        userId: owner.user.id,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      const res = await request(app)
        .patch(`${ticketsUrl}/${ticket.id}`)
        .set("Authorization", `Bearer ${anotherUser.accessToken}`)
        .send({
          title: "Updated",
        });

      expect(res.status).toBe(403);
    });

    it("should return 404 if ticket not found", async () => {
      const user = await authRequest();

      const fakeId = "9838e0ea-97f9-468e-bd9f-a4bf7c951da7";

      const res = await request(app)
        .patch(`${ticketsUrl}/${fakeId}`)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          title: "Updated",
        });

      expect(res.status).toBe(404);
    });

    it("should return 400 when price is negative", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      const res = await request(app)
        .patch(`${ticketsUrl}/${ticket.id}`)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          price: -100,
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 when capacity is less than reserved count", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
      });

      const ticket = await createTicket({
        eventId: event.id,
        reservedCount: 5,
        capacity: 10,
      });

      const res = await request(app)
        .patch(`${ticketsUrl}/${ticket.id}`)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          capacity: 4,
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 when maxPerUser is greater than capacity", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      const res = await request(app)
        .patch(`${ticketsUrl}/${ticket.id}`)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          capacity: 5,
          maxPerUser: 6,
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 when sale end time is before sale start time", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      const res = await request(app)
        .patch(`${ticketsUrl}/${ticket.id}`)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          saleStartsAt: "2026-08-01T10:00:00.000Z",
          saleEndsAt: "2026-07-31T10:00:00.000Z",
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 when validation fails", async () => {
      const user = await authRequest();

      const event = await createEvent({
        userId: user.user.id,
      });

      const ticket = await createTicket({
        eventId: event.id,
      });

      const res = await request(app)
        .patch(`${ticketsUrl}/${ticket.id}`)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          price: "invalid",
        });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/V1/tickets/:id", () => {
    it("it should Delete ticket with 204 status code", async () => {
      const user = await authRequest();
      const event = await createEvent({
        userId: user.user.id,
      });
      const ticket = await createTicket({
        eventId: event.id,
      });
      const res = await request(app)
        .delete(`${ticketsUrl}/${ticket.id}`)
        .set("Authorization", `Bearer ${user.accessToken}`);

      expect(res.statusCode).toBe(204);
    });
  });
});
