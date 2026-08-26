const express = require('express');
const {
  getGalleryPhotos,
  getAllPhotosAdmin,
  uploadPhoto,
  updatePhoto,
  deletePhoto,
} = require('../controllers/photoController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const upload = require('../middleware/upload');

const router = express.Router();

// All photo routes require authentication
router.use(protect);

router.get('/', getGalleryPhotos);
router.get('/all', adminOnly, getAllPhotosAdmin);
router.post('/', upload.single('image'), uploadPhoto);
router.put('/:photoId', upload.single('image'), updatePhoto);
router.delete('/:photoId', deletePhoto);

module.exports = router;
