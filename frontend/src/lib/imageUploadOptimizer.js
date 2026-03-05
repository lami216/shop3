const supportsWebP = (() => {
  let cachedResult = null;

  return () => {
    if (cachedResult !== null) return cachedResult;

    if (typeof document === "undefined") {
      cachedResult = false;
      return cachedResult;
    }

    const canvas = document.createElement("canvas");
    cachedResult = canvas.toDataURL("image/webp").startsWith("data:image/webp");
    return cachedResult;
  };
})();

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const loadBitmap = async (file) => {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      return createImageBitmap(file);
    }
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });
};

const isTransparentPngCandidate = (file) =>
  file.type === "image/png" && /icon|logo|badge|stamp/i.test(file.name || "");

const canvasToFile = (canvas, type, quality, fallbackName) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("BLOB_CREATION_FAILED"));
          return;
        }
        const extension = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
        resolve(new File([blob], `${fallbackName}.${extension}`, { type }));
      },
      type,
      quality
    );
  });

export const optimizeImageFile = async (file, options = {}) => {
  const {
    preservePng = false,
    maxSizeMB = 0.35,
    maxWidthOrHeight = 1600,
    initialQuality = 0.85,
  } = options;

  const shouldKeepPng = preservePng || isTransparentPngCandidate(file);
  const targetType = shouldKeepPng ? "image/png" : supportsWebP() ? "image/webp" : "image/jpeg";

  const source = await loadBitmap(file);
  const srcWidth = source.width || file.width;
  const srcHeight = source.height || file.height;
  const ratio = Math.min(1, maxWidthOrHeight / Math.max(srcWidth, srcHeight));
  const width = Math.max(1, Math.round(srcWidth * ratio));
  const height = Math.max(1, Math.round(srcHeight * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: true });
  ctx.drawImage(source, 0, 0, width, height);

  let quality = initialQuality;
  let optimized = await canvasToFile(canvas, targetType, quality, file.name.replace(/\.[^/.]+$/, "") || "upload");

  const maxBytes = maxSizeMB * 1024 * 1024;
  while (optimized.size > maxBytes && quality > 0.55 && targetType !== "image/png") {
    quality = Number((quality - 0.08).toFixed(2));
    optimized = await canvasToFile(canvas, targetType, quality, file.name.replace(/\.[^/.]+$/, "") || "upload");
  }

  return optimized;
};

export const optimizeImageToDataUrl = async (file, options = {}) => {
  const optimized = await optimizeImageFile(file, options);
  return readFileAsDataUrl(optimized);
};
