import InventoryBatch from "../models/inventoryBatch.model.js";
import Product from "../models/product.model.js";
import { sendTelegramMessage } from "./telegram.service.js";

const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD || 5);

const getAvailableProductQuantity = async (productId) => {
	const batches = await InventoryBatch.find({ product: productId });
	return batches.reduce((sum, batch) => sum + Math.max(batch.remainingQuantity - batch.reservedQuantity, 0), 0);
};

export const assertStockAvailability = async (requirements) => {
	for (const req of requirements) {
		const available = await getAvailableProductQuantity(req.productId);
		if (available < req.quantity) {
			throw new Error(`Insufficient inventory for product ${req.productId}`);
		}
	}
};

export const reserveInventory = async (requirements) => {
	for (const req of requirements) {
		let needed = req.quantity;
		const batches = await InventoryBatch.find({ product: req.productId, remainingQuantity: { $gt: 0 } }).sort({ receivedAt: 1, createdAt: 1 });

		for (const batch of batches) {
			if (needed <= 0) break;
			const freeQty = Math.max(batch.remainingQuantity - batch.reservedQuantity, 0);
			if (freeQty <= 0) continue;

			const reserveQty = Math.min(freeQty, needed);
			batch.reservedQuantity += reserveQty;
			await batch.save();
			needed -= reserveQty;
		}

		if (needed > 0) {
			throw new Error(`Insufficient inventory for product ${req.productId}`);
		}
	}
};

export const releaseReservation = async (requirements) => {
	for (const req of requirements) {
		let toRelease = req.quantity;
		const batches = await InventoryBatch.find({ product: req.productId, reservedQuantity: { $gt: 0 } }).sort({ receivedAt: 1, createdAt: 1 });

		for (const batch of batches) {
			if (toRelease <= 0) break;
			const releaseQty = Math.min(batch.reservedQuantity, toRelease);
			batch.reservedQuantity -= releaseQty;
			await batch.save();
			toRelease -= releaseQty;
		}
	}
};

export const consumeReservedInventoryFIFO = async (requirements) => {
	const breakdown = [];

	for (const req of requirements) {
		let needed = req.quantity;
		const batches = await InventoryBatch.find({
			product: req.productId,
			remainingQuantity: { $gt: 0 },
		}).sort({ receivedAt: 1, createdAt: 1 });

		for (const batch of batches) {
			if (needed <= 0) break;
			const reserved = Math.min(batch.reservedQuantity, needed);
			if (reserved > 0) {
				batch.reservedQuantity -= reserved;
				batch.remainingQuantity -= reserved;
				await batch.save();
				breakdown.push({
					product: req.productId,
					quantity: reserved,
					costPrice: batch.costPrice,
					batch: batch._id,
					lineCost: reserved * batch.costPrice,
				});
				needed -= reserved;
			}

			if (needed <= 0) break;

			const freeQty = Math.max(batch.remainingQuantity - batch.reservedQuantity, 0);
			if (freeQty <= 0) continue;

			const directConsume = Math.min(freeQty, needed);
			batch.remainingQuantity -= directConsume;
			await batch.save();
			breakdown.push({
				product: req.productId,
				quantity: directConsume,
				costPrice: batch.costPrice,
				batch: batch._id,
				lineCost: directConsume * batch.costPrice,
			});
			needed -= directConsume;
		}

		if (needed > 0) {
			throw new Error(`Unable to consume reserved inventory for ${req.productId}`);
		}

		const available = await getAvailableProductQuantity(req.productId);
		if (available <= LOW_STOCK_THRESHOLD) {
			const product = await Product.findById(req.productId).select("name");
			await sendTelegramMessage(`⚠️ Low stock alert: ${product?.name || req.productId} has ${available} units available.`);
		}
	}

	return breakdown;
};
