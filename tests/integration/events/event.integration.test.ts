import request from "supertest";
import app from "../../../src/app";
import { createEvent } from "../../factories/event.factory";
import { createUser } from "../../factories/user.factory";

const eventsUrl = "/api/V1/events";

describe("Event API", () => {
  describe("Get /api/V1/events", () => {
    it("it should return All events with 200 status code", async () => {
      const res = await request(app).get(`${eventsUrl}`);
      // .set("Authorization", `Bearer ${user.accessToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.results).toBeDefined();
      expect(res.body.pagination).toBeDefined();
      expect(res.body.data.events).toBeDefined();
    });
  });
  describe("Get /api/V1/events/:id", () => {
    it("it should return All events with 200 status code", async () => {
      const user = await createUser();
      const event = await createEvent({ userId: user.id });

      const res = await request(app).get(`${eventsUrl}/${event.id}`);
      // .set("Authorization", `Bearer ${user.accessToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.event.id).toBeDefined();
    });
  });
});
