import request from "supertest";
import app from "../../../src/app";
import { createEvent } from "../../factories/event.factory";
import { createUser } from "../../factories/user.factory";
import { createTicket } from "../../factories/ticket.factory";
import { authRequest } from "../../helpers/auth.helper";

const eventsUrl = "/api/V1/events";

describe("Event API", () => {
  describe("Get /api/V1/events", () => {
    it("it should return All events with 200 status code", async () => {
      const res = await request(app).get(`${eventsUrl}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.results).toBeDefined();
      expect(res.body.pagination).toBeDefined();
      expect(res.body.data.events).toBeDefined();
    });
  });
  describe("Get /api/V1/events/:id", () => {
    it("it should return event by id with 200 status code", async () => {
      const user = await createUser();
      const event = await createEvent({ userId: user.id });

      const res = await request(app).get(`${eventsUrl}/${event.id}`);
      // .set("Authorization", `Bearer ${user.accessToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.event.id).toBeDefined();
    });
  });
  describe("Get /api/V1/events/:eventId/tickets", () => {
    it("it should return All tickets that belong the event with 200 status code", async () => {
      const user = await createUser();
      const event = await createEvent({ userId: user.id });
      await createTicket({
        eventId: event.id,
      });

      const res = await request(app).get(`${eventsUrl}/${event.id}/tickets`);
      // .set("Authorization", `Bearer ${user.accessToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.results).toBeDefined();
      expect(res.body.data.tickets).toBeDefined();
    });
  });

  describe("POST /api/V1/events", () => {
    it("it should create event with 201 status code", async () => {
      const user = await authRequest();

      const res = await request(app)
        .post(`${eventsUrl}`)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          // userId: user.user.id,
          title: "Test title",
          location: "Test location",
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 200000),
        });

      console.log(res.error);

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.event.id).toBeDefined();
    });
  });
});
