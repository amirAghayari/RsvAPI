const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Ticket Reservation API",
    version: "1.0.0",
    description:
      "A standard, scalable, and secure API for a ticket reservation system capable of managing users and concurrent ticket reservations.",
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
        },
      },
      CreateReservationRequest: {
        type: "object",
        properties: {
          eventId: { type: "string", format: "uuid" },
          ticketCount: {
            type: "string",
            description:
              "Must be a string representation of a number between 1 and 3 (e.g., '1', '2', '3')",
          },
          details: {
            type: "string",
            description:
              'JSON stringified array of ticket owner details, e.g., [{"fullName":"John Doe","phoneNumber":"+989123456789"}, ...]',
          },
          pictures: {
            type: "array",
            items: { type: "string", format: "binary" },
            description:
              "Array of image files (jpg/png), number must match ticketCount",
          },
        },
        required: ["eventId", "ticketCount", "details", "pictures"],
      },
      ReservationResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          ticketCount: { type: "integer" },
          status: { type: "string", enum: ["pending", "paid", "canceled"] },
          ticketOwner: {
            type: "array",
            items: {
              type: "object",
              properties: {
                fullName: { type: "string" },
                phoneNumber: { type: "string" },
                picture: { type: "string" },
              },
            },
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
      CreateEventRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          capacity: { type: "integer" },
          executionDate: { type: "string", format: "date-time" },
          salesStartTime: { type: "string", format: "date-time" },
        },
        required: ["name", "capacity", "executionDate", "salesStartTime"],
      },
      RegisterRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
        required: ["name", "email", "password"],
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
        required: ["email", "password"],
      },
      RefreshRequest: {
        type: "object",
        properties: {
          refreshToken: { type: "string" },
        },
        required: ["refreshToken"],
      },
    },
    responses: {
      Unauthorized: {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      Forbidden: {
        description: "Forbidden (Admin only)",
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
            description: "Input error (duplicate email or invalid password)",
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
        summary: "User login",
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
            description: "Input error (wrong email or password)",
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
        summary: "Refresh token",
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
            description: "New tokens",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TokensResponse" },
              },
            },
          },
          "401": {
            description: "Invalid token",
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
        summary:
          "Create a new reservation with ticket details and national card images",
        description:
          "Creates a reservation. ticketCount must be a number between 1 and 3. details must be an array with length equal to ticketCount. Images are handled separately via Multer.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/CreateReservationRequest" },
                  {
                    type: "object",
                    properties: {
                      pictures: {
                        type: "array",
                        items: {
                          type: "string",
                          format: "binary",
                        },
                        description: "National card images (handled by Multer)",
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Reservation created successfully",
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
                        status: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description:
              "Invalid input or mismatch between ticketCount and details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "409": {
            description: "Not enough tickets available or sales not started",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
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
    },

    "/reservations/my": {
      get: {
        summary: "Get user's reservations",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "List of user's reservations",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/ReservationResponse",
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
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
    "/reservations/{reservationId}/cancel": {
      patch: {
        summary: "Cancel a reservation",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "reservationId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "ID of the reservation to cancel",
          },
        ],
        responses: {
          "200": {
            description: "Reservation canceled successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/ReservationResponse" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Only pending reservations can be canceled",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": {
            description: "Reservation not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
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
    },
    "/reservations/{reservationId}/pay": {
      patch: {
        summary: "Pay for a reservation",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "reservationId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "ID of the reservation to pay",
          },
        ],
        responses: {
          "200": {
            description: "Reservation paid successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/ReservationResponse" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Only pending reservations can be paid",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": {
            description: "Reservation not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
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
    },
    "/events": {
      get: {
        summary: "Get list of events",
        description:
          "Returns available events with buy button if tickets remain",
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
              schema: { $ref: "#/components/schemas/CreateEventRequest" },
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
          "401": { $ref: "#/components/responses/Unauthorized" },
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
    "/logs": {
      get: {
        summary: "Get system logs (admin only)",
        description:
          "Filter logs by user email, event ID, status, date range, min sold tickets, with pagination",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "userEmail",
            in: "query",
            schema: { type: "string" },
            description: "Filter by user email (partial match)",
          },
          {
            name: "eventId",
            in: "query",
            schema: { type: "string", format: "uuid" },
            description: "Filter by event ID",
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string" },
            description: "Filter by status (pending, paid, canceled)",
          },
          {
            name: "fromDate",
            in: "query",
            schema: { type: "string", format: "date-time" },
            description: "Filter logs from this date (ISO format)",
          },
          {
            name: "toDate",
            in: "query",
            schema: { type: "string", format: "date-time" },
            description: "Filter logs up to this date (ISO format)",
          },
          {
            name: "minSoldTickets",
            in: "query",
            schema: { type: "integer" },
            description: "Filter events with at least this many sold tickets",
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
            description: "Page number for pagination",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
            description: "Number of logs per page",
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
          "401": { $ref: "#/components/responses/Unauthorized" },
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
