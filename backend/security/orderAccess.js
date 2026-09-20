import crypto from "node:crypto";

const ACCESS_TOKEN_HEADER = "x-order-access-token";

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export const createOrderAccessCredential = () => {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
};

const getPresentedToken = (req) => {
  const value = req?.headers?.[ACCESS_TOKEN_HEADER];
  return Array.isArray(value) ? value[0] : value;
};

const tokenMatches = (presentedToken, storedHash) => {
  if (typeof presentedToken !== "string" || !presentedToken || typeof storedHash !== "string" || !storedHash) {
    return false;
  }

  const presentedHash = Buffer.from(hashToken(presentedToken), "hex");
  const expectedHash = Buffer.from(storedHash, "hex");
  return presentedHash.length === expectedHash.length && crypto.timingSafeEqual(presentedHash, expectedHash);
};

export const isOrderAccessAllowed = (req, order) => {
  const ownerId = order?.user?._id ?? order?.user;
  const requestUserId = req?.user?._id;
  if (ownerId && requestUserId && String(ownerId) === String(requestUserId)) {
    return true;
  }

  return tokenMatches(getPresentedToken(req), order?.guestAccessTokenHash);
};

export const ORDER_ACCESS_TOKEN_HEADER = ACCESS_TOKEN_HEADER;
