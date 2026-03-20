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
    return {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
      transformation: file.mimetype.startsWith('image/')
        ? [{ width: 1000, crop: 'limit' }]
        : undefined
    }
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
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
