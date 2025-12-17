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
          ticketOwners: {
            type: "array",
            items: { $ref: "#/components/schemas/TicketOwner" },
          },
          status: {
            type: "string",
            enum: ["pending", "paid", "canceled"],
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
          action: { type: "string", enum: ["reserve", "pay", "cancel"] },
          eventId: { type: "string", format: "uuid", nullable: true },
          timestamp: { type: "string", format: "date-time" },
          status: { type: "string" },
          details: { type: "object", nullable: true },
        },
      },
    },
    responses: {
      BadRequest: {
        description: "Validation error or invalid input",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      Unauthorized: {
        description: "Authentication failed or invalid token",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      Forbidden: {
        description: "Access forbidden (admin only)",
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
        summary: "User registration",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "name", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  name: { type: "string", minLength: 2 },
                  password: {
                    type: "string",
                    description:
                      "At least 8 characters, must contain at least one lowercase letter, one uppercase letter, and one digit",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "User login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Access and refresh tokens",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TokensResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
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
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "New tokens",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TokensResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/events": {
      get: {
        summary: "Get list of available events",
        responses: {
          "200": {
            description: "Array of events",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/EventResponse" },
                },
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
                required: [
                  "name",
                  "capacity",
                  "executionDate",
                  "salesStartTime",
                ],
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
        },
      },
    },
    "/reservations": {
      post: {
        summary: "Create a new reservation (max 3 tickets)",
        description:
          "Multipart/form-data request. The 'details' field must be a JSON string. Upload one picture per ticket holder using the field name 'pictures'.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["eventId", "ticketCount", "details", "pictures"],
                properties: {
                  eventId: { type: "string", format: "uuid" },
                  ticketCount: { type: "integer", minimum: 1, maximum: 3 },
                  details: {
                    type: "string",
                    description:
                      "JSON array of ticket holder details (as string)",
                    example:
                      '[{"fullName": "John Doe", "phoneNumber": "09123456789"}]',
                  },
                  pictures: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                    description: "National ID card images (one per ticket)",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Reservation created (status: pending)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        reservationId: { type: "string", format: "uuid" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { description: "Event not found" },
          "409": { description: "Not enough tickets or sales not started" },
        },
      },
    },
    "/reservations/my": {
      get: {
        summary: "Get current user's reservations",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "List of user's reservations",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ReservationResponse" },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/reservations/{reservationId}/pay": {
      patch: {
        summary: "Mark reservation as paid",
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
            description: "Reservation paid successfully",
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
    "/logs": {
      get: {
        summary: "System logs (admin only)",
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
        },
      },
    },
  },
};

export default swaggerSpec;
