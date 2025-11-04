import Joi from 'joi'

export const reportValidation = {
  create: Joi.object({
    entityName: Joi.string().required(),
    entityId: Joi.string().required(),
    reason: Joi.string().required(),
    description: Joi.string().allow(null, '').optional(),
  }),
}
