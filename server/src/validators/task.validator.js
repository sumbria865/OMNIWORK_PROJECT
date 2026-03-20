const { body } = require('express-validator')

const createTaskValidator = [
  body('projectId')
    .notEmpty().withMessage('Project ID is required'),

  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isLength({ min: 2, max: 200 }).withMessage('Title must be between 2 and 200 characters'),

  body('description')
    .optional()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),

  body('status')
    .optional()
    .isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'])
    .withMessage('Invalid task status'),

  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('Invalid priority level'),

  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid due date format'),

  body('estimatedHrs')
    .optional()
    .isFloat({ min: 0 }).withMessage('Estimated hours must be a positive number'),

  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
]

const updateTaskValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('Title must be between 2 and 200 characters'),

  body('description')
    .optional()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),

  body('status')
    .optional()
    .isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'])
    .withMessage('Invalid task status'),

  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('Invalid priority level'),

  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid due date format'),

  body('estimatedHrs')
    .optional()
    .isFloat({ min: 0 }).withMessage('Estimated hours must be a positive number'),

  body('actualHrs')
    .optional()
    .isFloat({ min: 0 }).withMessage('Actual hours must be a positive number')
]

const updateTaskStatusValidator = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'])
    .withMessage('Invalid task status')
]

const addCommentValidator = [
  body('content')
    .trim()
    .notEmpty().withMessage('Comment content is required')
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters')
]

module.exports = {
  createTaskValidator,
  updateTaskValidator,
  updateTaskStatusValidator,
  addCommentValidator
}