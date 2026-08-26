const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image buffer to Cloudinary using an upload stream.
 * @param {Buffer} fileBuffer - The image file buffer (from multer memoryStorage).
 * @param {string} folder - Cloudinary folder to store the asset in.
 * @returns {Promise<{secure_url: string, public_id: string}>}
 */
const uploadToCloudinary = (fileBuffer, folder = 'photo-gallery') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete an image from Cloudinary using its public ID.
 * @param {string} publicId
 * @returns {Promise<object>}
 */
const deleteFromCloudinary = (publicId) => {
  if (!publicId) return Promise.resolve(null);
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
};
