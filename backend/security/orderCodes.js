import crypto from "node:crypto";

export const createPublicOrderCode = (prefix = "") =>
  `${prefix}${crypto.randomBytes(16).toString("base64url")}`;
