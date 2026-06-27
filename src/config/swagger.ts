import swaggerJSDoc from "swagger-jsdoc";
const options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "Event Reservation API",
      version: "1.0.0",
      description: "API Documentation",
    },
    servers: [
      {
        url: "http://localhost:3000/api/V1",
      },
    ],

    components: {
      securitySchemas: {
        bearerAuth: {
          type: "http",
          schema: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/**/*.ts"],
};

export default swaggerJSDoc(options);
