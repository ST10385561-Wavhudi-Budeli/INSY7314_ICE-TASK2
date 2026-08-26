const express = require('express');
const {
  getMe,
  updateMe,
  getAllUsers,
  deleteUser,
  promoteUser,
  demoteUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

const router = express.Router();

// All routes below require authentication
router.use(protect);

router.get('/me', getMe);
router.put('/me', updateMe);

// Admin-only routes
router.get('/', adminOnly, getAllUsers);
router.delete('/:userId', adminOnly, deleteUser);
router.put('/:userId/promote', adminOnly, promoteUser);
router.put('/:userId/demote', adminOnly, demoteUser);

module.exports = router;
