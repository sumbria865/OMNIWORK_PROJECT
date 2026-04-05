const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary = require('../config/cloudinary')

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = 'omniwork/general'
    if (file.fieldname === 'avatar') folder = 'omniwork/avatars'
    if (file.fieldname === 'receipt') folder = 'omniwork/receipts'
    if (file.fieldname === 'attachment') folder = 'omniwork/attachments'
    if (file.fieldname === 'document') folder = 'omniwork/documents'

    const isImage = file.mimetype.startsWith('image/')

    return {
      folder,
      resource_type: isImage ? 'image' : 'raw', // ← ADD THIS
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
      transformation: isImage
        ? [{ width: 1000, crop: 'limit' }]
        : undefined
    }
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // ← change 5MB to 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, PDF and DOC files are allowed.'))
    }
  }
})

module.exports = { upload }