const crypto = require("crypto");
const admin = require("../config/firebaseAdmin");

const bucket = () => admin.storage().bucket();

const buildDownloadUrl = (bucketName, filePath, token) =>
  `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
    filePath
  )}?alt=media&token=${token}`;

const uploadBufferToStorage = async ({ filePath, buffer, contentType }) => {
  const storageBucket = bucket();
  const token = crypto.randomUUID();
  const file = storageBucket.file(filePath);

  await file.save(buffer, {
    resumable: false,
    metadata: {
      contentType,
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
  });

  return {
    storagePath: filePath,
    downloadUrl: buildDownloadUrl(storageBucket.name, filePath, token),
  };
};

const deleteStorageFile = async (filePath) => {
  if (!filePath) {
    return;
  }

  try {
    await bucket().file(filePath).delete();
  } catch (error) {
    if (error.code !== 404) {
      throw error;
    }
  }
};

module.exports = {
  deleteStorageFile,
  uploadBufferToStorage,
};
