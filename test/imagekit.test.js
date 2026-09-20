import assert from "node:assert/strict";
import test from "node:test";

import { uploadImage } from "../backend/lib/imagekit.js";

test("uploadImage uses the maintained ImageKit files API without changing its return contract", async () => {
  const calls = [];
  const fakeFile = { kind: "file" };
  const client = {
    files: {
      upload: async (params) => {
        calls.push(params);
        return { url: "https://images.example/receipt.webp", fileId: "file-1" };
      },
    },
  };
  const toFile = async (buffer, name) => {
    assert.deepEqual(buffer, Buffer.from("receipt"));
    assert.match(name, /^\d+\.webp$/);
    return fakeFile;
  };

  const result = await uploadImage(Buffer.from("receipt"), "order-receipts", {
    client,
    toFile,
    extension: "webp",
  });

  assert.deepEqual(calls, [{ file: fakeFile, fileName: calls[0].fileName, folder: "order-receipts" }]);
  assert.match(calls[0].fileName, /^\d+\.webp$/);
  assert.deepEqual(result, { url: "https://images.example/receipt.webp", fileId: "file-1" });
});
