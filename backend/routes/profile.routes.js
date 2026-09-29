const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  getProfile,
  updateProfile,
  changePassword,
  updateAvatar,
  deleteAvatar,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getFavourites,
  addFavourite,
  removeFavourite,
  getLoyalty,
  updatePreferences,
  updateNotifications,
  deleteAccount
} = require('../controllers/profile.controller');
const { protect } = require('../middleware/auth');

// Setup multer storage for avatar uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar_${req.user._id}_${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, PNG, WEBP) are allowed!'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

// All profile routes require authentication
router.use(protect);

router.route('/')
  .get(getProfile)
  .put(updateProfile);

router.put('/password', changePassword);

router.route('/avatar')
  .post(upload.single('avatar'), updateAvatar)
  .delete(deleteAvatar);

router.route('/addresses')
  .get(getAddresses)
  .post(addAddress);

router.route('/addresses/:id')
  .put(updateAddress)
  .delete(deleteAddress);

router.put('/addresses/:id/default', setDefaultAddress);

router.route('/favourites')
  .get(getFavourites);

router.route('/favourites/:productId')
  .post(addFavourite)
  .delete(removeFavourite);

router.get('/loyalty', getLoyalty);
router.put('/preferences', updatePreferences);
router.put('/notifications', updateNotifications);
router.delete('/account', deleteAccount);

module.exports = router;
