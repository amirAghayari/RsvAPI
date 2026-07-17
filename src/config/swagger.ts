import fs from "fs";
import path from "path";
import yaml from "yaml";

const swaggerPath = path.resolve(__dirname, "../../docs/user-auth-openapi.yaml");
const swaggerFile = fs.readFileSync(swaggerPath, "utf8");
const swaggerSpec = yaml.parse(swaggerFile);

export default swaggerSpec;
