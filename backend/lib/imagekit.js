import ImageKit from "imagekit";

const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

const isConfigured = Boolean(publicKey && privateKey && urlEndpoint);

const client = isConfigured
        ? new ImageKit({
                publicKey,
                privateKey,
                urlEndpoint,
        })
        : null;

const generateFileName = (folder) => {
        const prefix = typeof folder === "string" && folder.trim().length ? folder.trim() : "image";
        const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        return `${prefix}-${uniqueSuffix}`;
};

export const uploadImage = async (file, folder) => {
        if (!file || typeof file !== "string") {
                throw new Error("INVALID_IMAGE_DATA");
        }

        if (!client) {
                return { url: file, fileId: null };
        }

        const sanitizedFolder = typeof folder === "string" && folder.trim().length ? folder.trim() : undefined;

        const uploadResponse = await client.upload({
                file,
                fileName: generateFileName(sanitizedFolder),
                folder: sanitizedFolder,
                useUniqueFileName: true,
        });

        return { url: uploadResponse.url, fileId: uploadResponse.fileId };
};

export const deleteImage = async (fileId) => {
        if (!client || !fileId) {
                return;
        }

        await client.deleteFile(fileId);
};

export const isImageKitConfigured = () => isConfigured;
