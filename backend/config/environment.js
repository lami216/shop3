import dotenv from "dotenv";

export const ENV_FILE_PATH = "/etc/shop3/.env";

const requiredVariables = [
  "MONGO_URI",
  "UPSTASH_REDIS_URL",
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
  "IMAGEKIT_PRIVATE_KEY",
  "NODE_ENV",
];

export const validateEnvironment = (environment = process.env) => {
  const missing = requiredVariables.filter((name) => !environment[name]?.trim?.());
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
};

export const loadEnvironment = ({ configure = dotenv.config } = {}) => {
  const result = configure({ path: ENV_FILE_PATH });
  if (result?.error) throw result.error;
  return result?.parsed ?? {};
};
