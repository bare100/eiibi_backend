import Joi from 'joi'

export const postValidation = {
  createOrUpdate: Joi.object({
    latLng: Joi.string(),
    location: Joi.string(),
    title: Joi.string(),
    description: Joi.string().allow(null, '').optional(),
    price: Joi.number().optional().allow(null),
    hasCustomPrice: Joi.boolean().optional().allow(null),
    youtubeLink: Joi.string().optional().allow(null, ''),
    condition: Joi.string().optional().allow(null),
    initialCurrencyId: Joi.string().optional().allow(null, ''),
    mainCategoryId: Joi.string(),
    subCategoryId: Joi.string(),
    assetsToKeep: Joi.string().optional().allow(null, ''),
    files: Joi.any(),
  }),
}
