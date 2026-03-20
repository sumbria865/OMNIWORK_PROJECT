const { body } = require('express-validator')

const createProjectValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Project name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Project name must be between 2 and 100 characters'),

  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('status')
    .optional()
    .isIn(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'ARCHIVED'])
    .withMessage('Invalid project status'),

  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('Invalid priority level'),

  body('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),

  body('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format'),

  body('budget')
    .optional()
    .isNumeric().withMessage('Budget must be a number')
    .isFloat({ min: 0 }).withMessage('Budget cannot be negative'),

  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
]

const updateProjectValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Project name must be between 2 and 100 characters'),

  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('status')
    .optional()
    .isIn(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'ARCHIVED'])
    .withMessage('Invalid project status'),

  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('Invalid priority level'),

  body('progress')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100')
]

const addMemberValidator = [
  body('userId')
    .notEmpty().withMessage('User ID is required'),

  body('role')
    .optional()
    .isIn(['OWNER', 'MANAGER', 'MEMBER', 'VIEWER'])
    .withMessage('Invalid member role')
]

module.exports = {
  createProjectValidator,
  updateProjectValidator,
  addMemberValidator
}