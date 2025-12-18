const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Ticket Reservation API",
    version: "1.0.0",
    description:
      "Complete API for a ticket reservation system with JWT authentication, concurrent reservation management, system logging, and full OpenAPI documentation.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Access token obtained from /auth/login or /auth/refresh",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Bad request" },
        },
      },
      UserResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          name: { type: "string" },
        },
      },
      TokensResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
        },
      },
      EventResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          totalCapacity: { type: "integer" },
          remainingTickets: { type: "integer" },
          executionDate: { type: "string", format: "date-time" },
          salesStartTime: { type: "string", format: "date-time" },
          buyButtonAvailable: { type: "boolean" },
        },
      },
      TicketOwner: {
        type: "object",
        properties: {
          fullName: { type: "string" },
          phoneNumber: { type: "string" },
          picture: { type: "string", format: "url" },
        },
      },
      ReservationResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          ticketCount: { type: "integer" },
          status: { type: "string", enum: ["pending", "paid", "canceled"] },
          ticketOwner: {
            type: "array",
            items: { $ref: "#/components/schemas/TicketOwner" },
          },
          createdAt: { type: "string", format: "date-time" },
          event: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              executionDate: { type: "string", format: "date-time" },
            },
          },
        },
      },
      LogResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userEmail: { type: "string" },
          action: { type: "string", enum: ["reserve", "cancel", "pay"] },
          eventId: { type: "string", format: "uuid", nullable: true },
          timestamp: { type: "string", format: "date-time" },
          status: { type: "string" },
          details: { type: "object" },
        },
      },
      CreateReservationRequest: {
        type: "object",
        properties: {
          eventId: { type: "string", format: "uuid" },
          ticketCount: { type: "integer", minimum: 1, maximum: 3 },
          details: {
            type: "array",
            items: { $ref: "#/components/schemas/TicketOwner" },
          },
        },
      },
      RegisterRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      RefreshRequest: {
        type: "object",
        properties: {
          refreshToken: { type: "string" },
        },
      },
    },
    responses: {
      Forbidden: {
        description: "Forbidden",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "User created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserResponse" },
              },
            },
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Login user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Tokens issued",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TokensResponse" },
              },
            },
          },
          "400": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/refresh": {
      post: {
        summary: "Refresh access token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "New tokens issued",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TokensResponse" },
              },
            },
          },
          "401": {
            description: "Invalid refresh token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/events": {
      get: {
        summary: "Get all events",
        responses: {
          "200": {
            description: "List of events",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/EventResponse" },
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      post: {
        summary: "Create new event (admin only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  capacity: { type: "integer" },
                  executionDate: { type: "string", format: "date-time" },
                  salesStartTime: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Event created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/EventResponse" },
              },
            },
          },
          "403": { $ref: "#/components/responses/Forbidden" },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/reservations": {
      post: {
        summary: "Create reservation",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  eventId: { type: "string", format: "uuid" },
                  ticketCount: { type: "integer" },
                  details: {
                    type: "array",
                    items: { $ref: "#/components/schemas/TicketOwner" },
                  },
                  pictures: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Reservation created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReservationResponse" },
              },
            },
          },
          "400": {
            description: "Invalid request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "Not enough tickets or sales not started",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/reservations/my": {
      get: {
        summary: "Get my reservations",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "List of reservations",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ReservationResponse" },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/reservations/{reservationId}/cancel": {
      patch: {
        summary: "Cancel reservation",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "reservationId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Reservation canceled and tickets released",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReservationResponse" },
              },
            },
          },
          "400": { description: "Only pending reservations can be canceled" },
          "404": { description: "Reservation not found" },
        },
      },
    },
    "/reservations/{reservationId}/pay": {
      patch: {
        summary: "Pay reservation",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "reservationId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Reservation paid",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReservationResponse" },
              },
            },
          },
          "400": { description: "Only pending reservations can be paid" },
          "404": { description: "Reservation not found" },
        },
      },
    },
    "/logs": {
      get: {
        summary: "Get system logs (admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "userEmail", in: "query", schema: { type: "string" } },
          {
            name: "eventId",
            in: "query",
            schema: { type: "string", format: "uuid" },
          },
          { name: "status", in: "query", schema: { type: "string" } },
          {
            name: "fromDate",
            in: "query",
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "toDate",
            in: "query",
            schema: { type: "string", format: "date-time" },
          },
          { name: "minSoldTickets", in: "query", schema: { type: "integer" } },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: {
          "200": {
            description: "Filtered logs",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/LogResponse" },
                },
              },
            },
          },
          "403": { $ref: "#/components/responses/Forbidden" },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
};

export default swaggerSpec;
