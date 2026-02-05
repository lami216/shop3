import PaymentMethod from "../models/paymentMethod.model.js";

export const listPaymentMethods = async (_req, res) => {
	const methods = await PaymentMethod.find({ isActive: true }).sort({ createdAt: -1 });
	res.json(methods);
};

export const createPaymentMethod = async (req, res) => {
	const method = await PaymentMethod.create({ ...req.body, code: req.body.code?.toUpperCase() });
	res.status(201).json(method);
};
