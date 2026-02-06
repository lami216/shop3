import mongoose from "mongoose";
import PaymentMethod from "../models/paymentMethod.model.js";
import { uploadImage } from "../lib/imagekit.js";

export const getPublicPaymentMethods = async (_req, res) => {
  const methods = await PaymentMethod.find({ isActive: true })
    .select("name accountNumber imageUrl")
    .sort({ createdAt: -1 })
    .lean();
  console.log(`[payment-methods] db=${mongoose.connection.name} count=${methods.length}`);
  res.json({ methods });
};

export const getAdminPaymentMethods = async (_req, res) => {
  const methods = await PaymentMethod.find({}).sort({ createdAt: -1 });
  res.json({ methods });
};

export const createPaymentMethod = async (req, res) => {
  try {
    const { name, accountNumber, isActive } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
    if (!accountNumber?.trim()) return res.status(400).json({ message: "Account number is required" });
    if (!req.file) return res.status(400).json({ message: "Image is required" });

    const upload = await uploadImage(req.file.buffer, "payment-methods");
    const activeFlag = isActive === undefined ? true : isActive === "true" || isActive === true;
    const method = await PaymentMethod.create({
      name: name.trim(),
      accountNumber: accountNumber.trim(),
      imageUrl: upload.url,
      isActive: activeFlag,
    });
    res.status(201).json(method);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const togglePaymentMethod = async (req, res) => {
  const { isActive } = req.body;
  const method = await PaymentMethod.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!method) return res.status(404).json({ message: "Payment method not found" });
  res.json(method);
};
