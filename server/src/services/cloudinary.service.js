const cloudinary = require('../config/cloudinary')

const deleteFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result
  } catch (err) {
    console.error('Cloudinary delete error:', err.message)
    throw err
  }
}

const getPublicIdFromUrl = (url) => {
  if (!url) return null
  const parts = url.split('/')
  const filename = parts[parts.length - 1]
  const publicId = filename.split('.')[0]
  const folder = parts[parts.length - 2]
  return `${folder}/${publicId}`
}

const uploadBase64 = async (base64String, folder) => {
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder: `omniwork/${folder}`,
      resource_type: 'auto'
    })
    return result.secure_url
  } catch (err) {
    console.error('Cloudinary upload error:', err.message)
    throw err
  }
}

const deleteMultiple = async (publicIds) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds)
    return result
  } catch (err) {
    console.error('Cloudinary bulk delete error:', err.message)
    throw err
  }
}

module.exports = {
  deleteFile,
  getPublicIdFromUrl,
  uploadBase64,
  deleteMultiple
}