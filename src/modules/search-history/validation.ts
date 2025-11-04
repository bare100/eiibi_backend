import Joi from 'joi'

export const searchHistoryValidation = {
  create: Joi.object({
    searchKey: Joi.string(),
    type: Joi.string().allow(null, ''),
    data: Joi.string().allow(null, ''),
    entityId: Joi.string().allow(null, ''),
  }),
}
