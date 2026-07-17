import fs from "fs";
import path from "path";
import yaml from "yaml";

const userAuthSwaggerPath = path.resolve(
  __dirname,
  "../../docs/user-auth-openapi.yaml",
);
const eventSwaggerPath = path.resolve(__dirname, "../../docs/event-openapi.yaml");

const userAuthSwaggerFile = fs.readFileSync(userAuthSwaggerPath, "utf8");
const eventSwaggerFile = fs.readFileSync(eventSwaggerPath, "utf8");

const userAuthSwaggerSpec = yaml.parse(userAuthSwaggerFile);
const eventSwaggerSpec = yaml.parse(eventSwaggerFile);

const swaggerSpec = {
  ...userAuthSwaggerSpec,
  ...eventSwaggerSpec,
  paths: {
    ...(userAuthSwaggerSpec.paths || {}),
    ...(eventSwaggerSpec.paths || {}),
  },
  components: {
    ...(userAuthSwaggerSpec.components || {}),
    ...(eventSwaggerSpec.components || {}),
    securitySchemes: {
      ...(userAuthSwaggerSpec.components?.securitySchemes || {}),
      ...(eventSwaggerSpec.components?.securitySchemes || {}),
    },
    schemas: {
      ...(userAuthSwaggerSpec.components?.schemas || {}),
      ...(eventSwaggerSpec.components?.schemas || {}),
    },
  },
};

export default swaggerSpec;
