const prisma = require('../config/database')

const auditLog = (action, entity) => {
  return async (req, res, next) => {
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        try {
          await prisma.activityLog.create({
            data: {
              userId: req.user.id,
              action,
              entity,
              entityId: req.params.id || null,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'] || null
            }
          })
        } catch (err) {
          console.error('Audit log error:', err.message)
        }
      }
    })
    next()
  }
}

module.exports = { auditLog } 
