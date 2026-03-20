const { successResponse, errorResponse } = require('../utils/apiResponse.utils')
const { deleteFile, getPublicIdFromUrl } = require('../services/cloudinary.service')

const uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400)
    }

    return successResponse(res, 'File uploaded successfully', {
      url: req.file.path,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return errorResponse(res, 'No files uploaded', 400)
    }

    const files = req.files.map(file => ({
      url: file.path,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size
    }))

    return successResponse(res, 'Files uploaded successfully', { files })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const deleteUpload = async (req, res) => {
  try {
    const { url } = req.body
    if (!url) {
      return errorResponse(res, 'File URL is required', 400)
    }

    const publicId = getPublicIdFromUrl(url)
    if (!publicId) {
      return errorResponse(res, 'Invalid file URL', 400)
    }

    await deleteFile(publicId)

    return successResponse(res, 'File deleted successfully')
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

module.exports = {
  uploadSingle,
  uploadMultiple,
  deleteUpload
}