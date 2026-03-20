const router = require('express').Router()
const {
  getAllUsers,
  getUserById,
  updateProfile,
  changePassword,
  toggleUserStatus
} = require('../controllers/user.controller')
const { authMiddleware } = require('../middleware/auth.middleware')
const { authorizeRoles } = require('../middleware/rbac.middleware')
const { changePasswordValidator } = require('../validators/auth.validator')
const { validate } = require('../middleware/validate.middleware')
const { upload } = require('../middleware/upload.middleware')

// All routes require authentication
router.use(authMiddleware)

// Get all users — admin and manager only
router.get('/', authorizeRoles('ADMIN', 'MANAGER'), getAllUsers)

// Get user by id
router.get('/:id', getUserById)

// Update own profile
router.put('/profile', upload.single('avatar'), updateProfile)

// Change password
router.put('/change-password', changePasswordValidator, validate, changePassword)

// Toggle user active status — admin only
router.patch('/:id/toggle-status', authorizeRoles('ADMIN'), toggleUserStatus)

module.exports = router