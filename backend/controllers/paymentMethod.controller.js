import PaymentMethod from "../models/paymentMethod.model.js";

const toBoolean = (value, fallback = true) => {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
};

const ensureAdmin = (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ message: "Forbidden" });
    return false;
  }
  return true;
};

export const getPaymentMethods = async (req, res) => {
  const includeInactive = req.query.includeInactive === "true";

  if (includeInactive) {
    if (!ensureAdmin(req, res)) return;
  }

  const filter = includeInactive ? {} : { isActive: true };
  const methods = await PaymentMethod.find(filter).sort({ createdAt: -1 }).lean();
  res.json({ methods });
};

export const createPaymentMethod = async (req, res) => {
  try {
    const { name, accountNumber, isActive } = req.body;

    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
    if (!accountNumber?.trim()) return res.status(400).json({ message: "Account number is required" });

    const method = await PaymentMethod.create({
      name: name.trim(),
      accountNumber: accountNumber.trim(),
      isActive: toBoolean(isActive, true),
    });

    res.status(201).json({ method });
  } catch (error) {
    console.error("Failed to create payment method", error);
    res.status(500).json({ message: "Failed to create payment method" });
  }
};

export const updatePaymentMethod = async (req, res) => {
  try {
    const { name, accountNumber, isActive } = req.body;

    const method = await PaymentMethod.findById(req.params.id);
    if (!method) return res.status(404).json({ message: "Payment method not found" });

    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ message: "Name is required" });
      method.name = name.trim();
    }

    if (accountNumber !== undefined) {
      if (!accountNumber.trim()) return res.status(400).json({ message: "Account number is required" });
      method.accountNumber = accountNumber.trim();
    }

    if (isActive !== undefined) {
      method.isActive = toBoolean(isActive, method.isActive);
    }

    await method.save();
    res.json({ method });
  } catch (error) {
    console.error("Failed to update payment method", error);
    res.status(500).json({ message: "Failed to update payment method" });
  }
};

export const deletePaymentMethod = async (req, res) => {
  try {
    const method = await PaymentMethod.findById(req.params.id);
    if (!method) return res.status(404).json({ message: "Payment method not found" });

    await method.deleteOne();
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete payment method", error);
    res.status(500).json({ message: "Failed to delete payment method" });
  }
};
