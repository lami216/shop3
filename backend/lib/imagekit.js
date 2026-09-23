import ImageKit, { toFile as imageKitToFile } from "@imagekit/nodejs";

let defaultClient;

const getClient = () => {
  if (!process.env.IMAGEKIT_PRIVATE_KEY) {
    throw new Error("Image upload service is not configured");
  }

  defaultClient ??= new ImageKit({ privateKey: process.env.IMAGEKIT_PRIVATE_KEY });
  return defaultClient;
};

const dataUrlToBuffer = (value) => {
  const match = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i.exec(value);
  if (!match) return null;

  const extension = match[1] === "image/png" ? "png" : match[1] === "image/webp" ? "webp" : "jpg";
  return { buffer: Buffer.from(match[2].replace(/\s/g, ""), "base64"), extension };
};

const normalizeUpload = (input, extension) => {
  if (Buffer.isBuffer(input) || input instanceof Uint8Array) {
    return { buffer: input, extension };
  }

  if (typeof input === "string") {
    const parsed = dataUrlToBuffer(input.trim());
    if (parsed) return parsed;
  }

  throw new Error("Unsupported image upload input");
};

export async function uploadImage(fileBase64OrBuffer, folder = "products", options = {}) {
  const client = options.client ?? getClient();
  const toFile = options.toFile ?? imageKitToFile;
  const normalized = normalizeUpload(fileBase64OrBuffer, options.extension ?? "jpg");
  const fileName = `${Date.now()}.${normalized.extension}`;
  const file = await toFile(normalized.buffer, fileName);
  const response = await client.files.upload({ file, fileName, folder });
  return { url: response.url, fileId: response.fileId };
}

export async function deleteImage(fileId, options = {}) {
  if (!fileId) return;
  const client = options.client ?? getClient();
  await client.files.delete(fileId);
}
