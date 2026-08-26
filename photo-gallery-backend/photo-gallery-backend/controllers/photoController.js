const Photo = require('../models/Photo');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// @route   GET /api/photos
// @desc    Return all photos in the gallery (public to any authenticated user)
// @access  Private
const getGalleryPhotos = async (_req, res, next) => {
  try {
    const photos = await Photo.find()
      .sort({ createdAt: -1 })
      .populate('owner', 'username email role');

    res.status(200).json(photos);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/photos/all
// @desc    Return all uploaded photos (admin view - identical dataset to /api/photos,
//          exposed as a distinct admin-only endpoint per the spec)
// @access  Private/Admin
const getAllPhotosAdmin = async (_req, res, next) => {
  try {
    const photos = await Photo.find()
      .sort({ createdAt: -1 })
      .populate('owner', 'username email role');

    res.status(200).json(photos);
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/photos
// @desc    Upload a new photo (multipart/form-data: image, title, description)
// @access  Private
const uploadPhoto = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'An image file is required (field name: "image")' });
    }

    const result = await uploadToCloudinary(req.file.buffer);

    const photo = await Photo.create({
      title,
      description: description || '',
      imageUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      owner: req.user._id,
    });

    const populatedPhoto = await photo.populate('owner', 'username email role');

    res.status(201).json(populatedPhoto);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/photos/:photoId
// @desc    Update a photo's title, description, and/or image
// @access  Private (owner or admin)
const updatePhoto = async (req, res, next) => {
  try {
    const { photoId } = req.params;
    const { title, description } = req.body;

    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    const isOwner = photo.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to update this photo' });
    }

    if (title !== undefined) photo.title = title;
    if (description !== undefined) photo.description = description;

    // If a new image was supplied, upload it first, then delete the old asset
    // only after the new upload succeeds.
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      const previousPublicId = photo.cloudinaryPublicId;

      photo.imageUrl = result.secure_url;
      photo.cloudinaryPublicId = result.public_id;

      await photo.save();

      // Best-effort cleanup of the old Cloudinary asset; failure here shouldn't
      // fail the request since the DB record is already correctly updated.
      try {
        await deleteFromCloudinary(previousPublicId);
      } catch (cleanupError) {
        console.error(`Failed to delete previous Cloudinary asset ${previousPublicId}:`, cleanupError.message);
      }
    } else {
      await photo.save();
    }

    const populatedPhoto = await photo.populate('owner', 'username email role');

    res.status(200).json(populatedPhoto);
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/photos/:photoId
// @desc    Delete a photo record and its Cloudinary asset
// @access  Private (owner or admin)
const deletePhoto = async (req, res, next) => {
  try {
    const { photoId } = req.params;

    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    const isOwner = photo.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to delete this photo' });
    }

    await deleteFromCloudinary(photo.cloudinaryPublicId);
    await photo.deleteOne();

    res.status(200).json({ message: 'Photo deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGalleryPhotos,
  getAllPhotosAdmin,
  uploadPhoto,
  updatePhoto,
  deletePhoto,
};
