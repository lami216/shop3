import PaymentMethod from "../models/paymentMethod.model.js";

export const getPaymentMethods = async (req, res) => {
  const onlyActive = req.query.active === "1";
  const filter = onlyActive ? { isActive: true } : {};
  const methods = await PaymentMethod.find(filter).sort({ createdAt: -1 });
  res.json({ methods });
};

export const createPaymentMethod = async (req, res) => {
  const { name, accountNumber, image, isActive } = req.body;
  const method = await PaymentMethod.create({ name, accountNumber, image, isActive: isActive !== false });
  res.status(201).json(method);
};

export const updatePaymentMethod = async (req, res) => {
  const method = await PaymentMethod.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!method) return res.status(404).json({ message: "Payment method not found" });
  res.json(method);
};
