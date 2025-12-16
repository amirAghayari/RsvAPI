const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Ticket Reservation API",
    version: "1.0.0",
    description:
      "API documentation for the Ticket Reservation service, including user authentication, event listing, and concurrent ticket reservation.",
  },
  servers: [{ url: "http://localhost:3000" }],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },

    schemas: {
      User: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
            example: "27b2c7c4-490e-48d0-8ac3-aed2613439d2",
          },
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
          name: { type: "string", example: "Ali Rezaei" },
        },
      },

      RegisterRequest: {
        type: "object",
        required: ["email", "name", "password"],
        properties: {
          email: { type: "string", format: "email" },
          name: { type: "string" },
          password: { type: "string" },
        },
      },

      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },

      Tokens: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
        },
      },

      RefreshRequest: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string" },
        },
      },

      LogoutRequest: {
        type: "object",
        required: ["userId"],
        properties: {
          userId: { type: "string", format: "uuid" },
        },
      },

      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },

      EventListItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Concert A" },
          totalCapacity: { type: "integer", example: 500 },
          remainingTickets: { type: "integer", example: 150 },
          executionDate: {
            type: "string",
            format: "date-time",
            example: "2024-12-31T20:00:00Z",
            description: "Event execution date and time.",
          },
          salesStartTime: {
            type: "string",
            format: "date-time",
            example: "2024-11-01T10:00:00Z",
            description: "Ticket sales start date and time.",
          },
        },
      },

      TicketDetailItem: {
        type: "object",
        required: ["fullName", "phoneNumber"],
        properties: {
          fullName: { type: "string", example: "Ali Ahmadi" },
          phoneNumber: { type: "string", example: "09121234567" },
        },
      },

      CreateReservationRequest: {
        type: "object",
        required: ["eventId", "ticketCount", "details", "nationalCardPictures"],
        properties: {
          eventId: {
            type: "string",
            format: "uuid",
            description: "ID of the event to reserve tickets for.",
          },
          ticketCount: {
            type: "integer",
            minimum: 1,
            maximum: 3,
            description: "Number of tickets to reserve (minimum 1, maximum 3).",
          },
          details: {
            type: "string",
            description:
              "JSON string containing an array of ticket holder details. The array length must match ticketCount.",
            example: JSON.stringify([
              { fullName: "Ali Ahmadi", phoneNumber: "09121234567" },
            ]),
          },
          nationalCardPictures: {
            type: "array",
            description:
              "Array of national ID card images. One image is required per ticket.",
            items: {
              type: "string",
              format: "binary",
            },
            minItems: 1,
            maxItems: 3,
          },
        },
      },

      ReservationCreatedResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Reservation created successfully. Awaiting payment.",
          },
          reservationId: {
            type: "string",
            format: "uuid",
          },
          status: {
            type: "string",
            enum: ["pending", "paid", "canceled"],
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
            description: "User successfully created.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "400": {
            description: "Bad Request",
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
        summary: "Authenticate user and return access tokens",
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
            description: "Authentication successful.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Tokens" },
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
        summary: "Refresh access and refresh tokens",
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
            description: "Tokens refreshed successfully.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Tokens" },
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

    "/me": {
      get: {
        summary: "Retrieve current authenticated user information",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "User information retrieved successfully.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
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

    "/events": {
      get: {
        summary: "Retrieve list of all available events",
        responses: {
          "200": {
            description: "List of events retrieved successfully.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/EventListItem" },
                },
              },
            },
          },
          "500": {
            description: "Internal Server Error",
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
        summary: "Create a new ticket reservation (maximum 3 tickets)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                $ref: "#/components/schemas/CreateReservationRequest",
              },
            },
          },
        },
        responses: {
          "201": {
            description:
              "Reservation created successfully and is pending payment.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ReservationCreatedResponse",
                },
              },
            },
          },
          "400": {
            description: "Bad Request (validation error)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
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
          "409": {
            description:
              "Conflict due to insufficient tickets or concurrent reservation.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description:
              "Event not found or ticket sales have not started yet.",
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
