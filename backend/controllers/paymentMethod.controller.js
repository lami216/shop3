import PaymentMethod from "../models/paymentMethod.model.js";

export const getPublicPaymentMethods = async (_req, res) => {
  const methods = await PaymentMethod.find({ isActive: true }).sort({ createdAt: -1 });
  res.json({ methods });
};

export const getAdminPaymentMethods = async (_req, res) => {
  const methods = await PaymentMethod.find({}).sort({ createdAt: -1 });
  res.json({ methods });
};

export const createPaymentMethod = async (req, res) => {
  const { name, type, instructions, accountNumber, holderName, image, isActive } = req.body;
  const method = await PaymentMethod.create({
    name,
    type,
    instructions,
    accountNumber,
    holderName,
    image,
    isActive: isActive !== false,
  });
  res.status(201).json(method);
};

export const updatePaymentMethod = async (req, res) => {
  const method = await PaymentMethod.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!method) return res.status(404).json({ message: "Payment method not found" });
  res.json(method);
};
