const router = require('express').Router()
const {
  uploadSingle,
  uploadMultiple,
  deleteUpload
} = require('../controllers/upload.controller')
const { authMiddleware } = require('../middleware/auth.middleware')
const { upload } = require('../middleware/upload.middleware')
const { uploadLimiter } = require('../middleware/rateLimit.middleware')

router.use(authMiddleware)
router.use(uploadLimiter)

// Single file upload
router.post('/single', upload.single('file'), uploadSingle)

// Multiple files upload
router.post('/multiple', upload.array('files', 5), uploadMultiple)

// Delete uploaded file
router.delete('/', deleteUpload)

module.exports = router