import Bundle from "../models/bundle.model.js";

export const ORDER_RESERVATION_MINUTES = 15;

const randomToken = (size = 6) => Math.random().toString(36).slice(2, 2 + size).toUpperCase();

export const generateOrderNumber = () => `ORD-${Date.now()}-${randomToken(4)}`;
export const generateTrackingCode = () => `TRK-${randomToken(8)}`;

export const expandOrderItemsToInventoryRequirements = async (items) => {
	const requirementsMap = new Map();
	const normalizedItems = [];

	for (const item of items) {
		if (item.itemType === "BUNDLE") {
			const bundle = await Bundle.findById(item.bundleId);
			if (!bundle || !bundle.isActive) {
				throw new Error("Bundle not found or inactive");
			}

			normalizedItems.push({
				itemType: "BUNDLE",
				bundle: bundle._id,
				name: bundle.name,
				quantity: item.quantity,
				price: bundle.bundlePrice,
				reservationBreakdown: bundle.components.map((component) => ({
					product: component.product,
					quantity: component.quantity * item.quantity,
				})),
			});

			for (const component of bundle.components) {
				const qty = component.quantity * item.quantity;
				const key = String(component.product);
				requirementsMap.set(key, (requirementsMap.get(key) || 0) + qty);
			}

			continue;
		}

		normalizedItems.push({
			itemType: "PRODUCT",
			product: item.productId,
			name: item.name,
			quantity: item.quantity,
			price: item.price,
			reservationBreakdown: [{ product: item.productId, quantity: item.quantity }],
		});

		const key = String(item.productId);
		requirementsMap.set(key, (requirementsMap.get(key) || 0) + item.quantity);
	}

	const requirements = [...requirementsMap.entries()].map(([productId, quantity]) => ({ productId, quantity }));

	return { requirements, normalizedItems };
};
