import assert from "node:assert/strict";
import test from "node:test";
import crypto from "node:crypto";
import request from "supertest";

import { createApp } from "../backend/app.js";
import { createOrderRouter } from "../backend/routes/order.route.js";
import { createReadiness } from "../backend/runtime/startApplication.js";
import { MAX_RECEIPT_BYTES } from "../backend/security/receiptUpload.js";

const token = "guest-capability";
const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
const order = {
  _id: "507f1f77bcf86cd799439011",
  user: null,
  guestAccessTokenHash: tokenHash,
  status: "pending_approval",
  products: [],
  trackingCode: "TRK-secure",
  populate: async function populate() { return this; },
  toJSON() {
    const { guestAccessTokenHash: _hidden, ...safe } = this;
    return safe;
  },
};
const queryFor = (value) => ({ select: async () => value });
const OrderModel = {
  findOne: ({ trackingCode }) => queryFor(trackingCode === order.trackingCode ? order : null),
  findById: (id) => queryFor(id === order._id ? order : null),
};

const createTestApp = ({
  orderModel = OrderModel,
  protectRouteMiddleware,
  adminRouteMiddleware,
} = {}) =>
  createApp({
    readiness: createReadiness(),
    registerRoutes: (app) => app.use("/orders", createOrderRouter({
      OrderModel: orderModel,
      protectRouteMiddleware,
      adminRouteMiddleware,
    })),
    logger: { error: () => {} },
  });

test("legacy claim issuance requires authentication", async () => {
  const response = await request(createTestApp()).post(`/orders/admin/${order._id}/legacy-guest-claim`);

  assert.equal(response.status, 401);
});

test("non-admin users cannot issue legacy claim links", async () => {
  let issuanceAttempted = false;
  const orderModel = {
    ...OrderModel,
    async findOneAndUpdate() {
      issuanceAttempted = true;
      return order;
    },
  };
  const protectRouteMiddleware = (req, _res, next) => {
    req.user = { _id: "customer-1", role: "customer" };
    next();
  };
  const adminRouteMiddleware = (req, res, next) =>
    req.user?.role === "admin" ? next() : res.status(403).json({ message: "Access denied - Admin only" });

  const response = await request(createTestApp({ orderModel, protectRouteMiddleware, adminRouteMiddleware }))
    .post(`/orders/admin/${order._id}/legacy-guest-claim`);

  assert.equal(response.status, 403);
  assert.equal(issuanceAttempted, false);
});

test("an authenticated admin can issue a 72-hour legacy claim link after manual verification", async () => {
  const legacyOrder = { _id: order._id, trackingCode: "TRK-legacy" };
  const orderModel = {
    ...OrderModel,
    async findOneAndUpdate() {
      return legacyOrder;
    },
  };
  const protectRouteMiddleware = (req, _res, next) => {
    req.user = { _id: "admin-1", role: "admin" };
    next();
  };
  const adminRouteMiddleware = (req, res, next) =>
    req.user?.role === "admin" ? next() : res.status(403).json({ message: "Access denied - Admin only" });

  const response = await request(createTestApp({ orderModel, protectRouteMiddleware, adminRouteMiddleware }))
    .post(`/orders/admin/${order._id}/legacy-guest-claim`);

  assert.equal(response.status, 201);
  assert.equal(typeof response.body.claimToken, "string");
  assert.equal(response.body.claimPath, `/claim-legacy-order/${order._id}#token=${response.body.claimToken}`);
  assert.equal(new Date(response.body.expiresAt).getTime() - Date.now() > 71.9 * 60 * 60 * 1000, true);
  assert.equal(new Date(response.body.expiresAt).getTime() - Date.now() <= 72 * 60 * 60 * 1000, true);
});

test("a legacy claim link establishes the normal guest capability", async () => {
  const orderModel = {
    ...OrderModel,
    async findOneAndUpdate() {
      return { _id: order._id, trackingCode: "TRK-legacy" };
    },
  };

  const response = await request(createTestApp({ orderModel }))
    .post(`/orders/${order._id}/legacy-guest-claim`)
    .send({ token: "one-time-claim-token" });

  assert.equal(response.status, 200);
  assert.equal(response.body.orderId, order._id);
  assert.equal(response.body.trackingCode, "TRK-legacy");
  assert.equal(typeof response.body.guestAccessToken, "string");
  assert.equal(response.body.token, undefined);
});

test("tracking endpoint conceals an order when the guest capability is missing", async () => {
  const response = await request(createTestApp()).get("/orders/tracking/TRK-secure");
  assert.equal(response.status, 404);
  assert.deepEqual(response.body, { message: "Order not found" });
});

test("tracking endpoint returns the order for the matching guest capability", async () => {
  const response = await request(createTestApp())
    .get("/orders/tracking/TRK-secure")
    .set("X-Order-Access-Token", token);
  assert.equal(response.status, 200);
  assert.equal(response.body.order.trackingCode, "TRK-secure");
  assert.equal(response.body.order.guestAccessTokenHash, undefined);
});

test("receipt upload rejects unsupported content types before controller execution", async () => {
  const response = await request(createTestApp())
    .post(`/orders/${order._id}/payment-proof`)
    .set("X-Order-Access-Token", token)
    .attach("receiptImage", Buffer.from("not an image"), {
      filename: "receipt.txt",
      contentType: "text/plain",
    });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { message: "Invalid receipt image" });
});

test("receipt upload rejects files larger than five megabytes", async () => {
  const response = await request(createTestApp())
    .post(`/orders/${order._id}/payment-proof`)
    .set("X-Order-Access-Token", token)
    .attach("receiptImage", Buffer.alloc(MAX_RECEIPT_BYTES + 1), {
      filename: "receipt.png",
      contentType: "image/png",
    });

  assert.equal(response.status, 413);
  assert.deepEqual(response.body, { message: "Receipt image is too large" });
});

test("id payment-session endpoint is protected by the same capability", async () => {
  const denied = await request(createTestApp()).get(`/orders/${order._id}/payment-session`);
  assert.equal(denied.status, 404);

  const allowed = await request(createTestApp())
    .get(`/orders/${order._id}/payment-session`)
    .set("X-Order-Access-Token", token);
  assert.equal(allowed.status, 200);
  assert.equal(allowed.body.order._id, order._id);
});
