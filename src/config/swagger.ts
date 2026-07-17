import fs from "fs";
import path from "path";
import yaml from "yaml";

const docsDir = path.resolve(__dirname, "../../docs");

const baseSwaggerPath = path.resolve(docsDir, "base-openapi.yaml");
const docFiles = [
  "user-auth-openapi.yaml",
  "event-openapi.yaml",
  "ticket-openapi.yaml",
  "reservation-openapi.yaml",
  "payment-openapi.yaml",
];

const baseSwaggerFile = fs.readFileSync(baseSwaggerPath, "utf8");
const baseSwaggerSpec = yaml.parse(baseSwaggerFile);

const parsedSpecs = docFiles.map((fileName) => {
  const filePath = path.resolve(docsDir, fileName);
  const fileContent = fs.readFileSync(filePath, "utf8");
  return yaml.parse(fileContent);
});

const [
  userAuthSwaggerSpec,
  eventSwaggerSpec,
  ticketSwaggerSpec,
  reservationSwaggerSpec,
  paymentSwaggerSpec,
] = parsedSpecs;

const swaggerSpec = {
  ...baseSwaggerSpec,
  ...userAuthSwaggerSpec,
  ...eventSwaggerSpec,
  ...ticketSwaggerSpec,
  ...reservationSwaggerSpec,
  ...paymentSwaggerSpec,
  paths: {
    ...(userAuthSwaggerSpec.paths || {}),
    ...(eventSwaggerSpec.paths || {}),
    ...(ticketSwaggerSpec.paths || {}),
    ...(reservationSwaggerSpec.paths || {}),
    ...(paymentSwaggerSpec.paths || {}),
  },
  components: {
    ...(baseSwaggerSpec.components || {}),
    ...(userAuthSwaggerSpec.components || {}),
    ...(eventSwaggerSpec.components || {}),
    ...(ticketSwaggerSpec.components || {}),
    ...(reservationSwaggerSpec.components || {}),
    ...(paymentSwaggerSpec.components || {}),
    securitySchemes: {
      ...(baseSwaggerSpec.components?.securitySchemes || {}),
      ...(userAuthSwaggerSpec.components?.securitySchemes || {}),
      ...(eventSwaggerSpec.components?.securitySchemes || {}),
      ...(ticketSwaggerSpec.components?.securitySchemes || {}),
      ...(reservationSwaggerSpec.components?.securitySchemes || {}),
      ...(paymentSwaggerSpec.components?.securitySchemes || {}),
    },
    schemas: {
      ...(baseSwaggerSpec.components?.schemas || {}),
      ...(userAuthSwaggerSpec.components?.schemas || {}),
      ...(eventSwaggerSpec.components?.schemas || {}),
      ...(ticketSwaggerSpec.components?.schemas || {}),
      ...(reservationSwaggerSpec.components?.schemas || {}),
      ...(paymentSwaggerSpec.components?.schemas || {}),
    },
  },
};

export default swaggerSpec;
