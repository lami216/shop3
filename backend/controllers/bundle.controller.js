import Bundle from "../models/bundle.model.js";

export const listBundles = async (_req, res) => {
	const bundles = await Bundle.find({ isActive: true }).populate("components.product", "name price image");
	res.json(bundles);
};

export const createBundle = async (req, res) => {
	const bundle = await Bundle.create(req.body);
	res.status(201).json(bundle);
};
