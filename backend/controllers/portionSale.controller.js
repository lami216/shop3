import PortionSale from "../models/portionSale.model.js";

export const getPortionSalesSummary = async (_req, res) => {
  try {
    const sales = await PortionSale.find({}).populate("order_id", "trackingCode orderNumber").sort({ created_at: -1 }).lean();

    const groupedMap = new Map();

    for (const sale of sales) {
      const key = `${sale.product_id?.toString?.() || ""}-${sale.portion_size_ml}`;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          productId: sale.product_id,
          productName: sale.product_name,
          portionSizeMl: sale.portion_size_ml,
          totalQuantity: 0,
          entries: [],
        });
      }

      const bucket = groupedMap.get(key);
      bucket.totalQuantity += Number(sale.quantity) || 0;
      bucket.entries.push({
        id: sale._id,
        quantity: sale.quantity,
        orderId: sale.order_id?._id || sale.order_id,
        orderTrackingCode: sale.order_id?.trackingCode || null,
        orderNumber: sale.order_id?.orderNumber || null,
        createdAt: sale.created_at,
      });
    }

    res.json({ sales: Array.from(groupedMap.values()) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
