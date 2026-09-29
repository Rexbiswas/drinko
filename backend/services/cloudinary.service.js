const path = require('path');
const fs = require('fs');

let cloudinary = null;
const isCloudinaryConfigured = Boolean(
  (process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET) ||
  process.env.CLOUDINARY_URL
);

if (isCloudinaryConfigured) {
  try {
    cloudinary = require('cloudinary').v2;
    if (process.env.CLOUDINARY_URL) {
      cloudinary.config({
        secure: true
      });
    } else {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
      });
    }
    console.log(`[Media Storage] Cloudinary integration enabled (Cloud: ${process.env.CLOUDINARY_CLOUD_NAME || 'active'}).`);
  } catch (err) {
    console.warn('[Media Storage] Cloudinary initialization fallback to local storage:', err.message);
  }
} else {
  console.log('[Media Storage] Cloudinary keys not provided. Uploads will be stored in local /uploads directory.');
}

const uploadImage = async (filePath, options = {}) => {
  const folder = typeof options === 'string' ? options : (options.folder || 'drinko_profiles');

  if (isCloudinaryConfigured && cloudinary) {
    const uploadOptions = {
      folder,
      resource_type: 'auto'
    };

    if (folder === 'drinko_profiles') {
      uploadOptions.transformation = [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ];
    }

    if (typeof options === 'object' && options.transformation) {
      uploadOptions.transformation = options.transformation;
    }

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    // Remove temporary local file after uploading to cloud
    try { fs.unlinkSync(filePath); } catch (e) {}
    return result.secure_url;
  }

  // Fallback: Return local web path
  const filename = path.basename(filePath);
  return `/uploads/${filename}`;
};

const deleteImage = async (imageUrl) => {
  if (!imageUrl) return;

  if (isCloudinaryConfigured && cloudinary && imageUrl.includes('cloudinary.com')) {
    try {
      const urlWithoutParams = imageUrl.split('?')[0];
      const parts = urlWithoutParams.split('/');
      const filenameWithExt = parts.pop();
      const publicIdWithoutExt = filenameWithExt.split('.')[0];
      const folderName = parts.pop();
      const publicId = (folderName && folderName !== 'upload' && !folderName.startsWith('v'))
        ? `${folderName}/${publicIdWithoutExt}`
        : publicIdWithoutExt;

      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.warn('[Media Storage] Cloudinary delete failed:', err.message);
    }
  } else if (imageUrl.startsWith('/uploads/')) {
    try {
      const localPath = path.join(__dirname, '../../', imageUrl);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    } catch (err) {}
  }
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadImage,
  deleteImage
};
