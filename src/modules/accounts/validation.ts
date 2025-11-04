import Joi from 'joi'

export const accountValidation = {
  update: Joi.object({
    meta: Joi.alt(Joi.string(), Joi.object()),
    name: Joi.string().min(0).max(100).allow(null),
    locationLatLng: Joi.string().allow('', null).optional(),
    locationPretty: Joi.string().allow('', null).optional(),
    acceptedTermsAndCondition: Joi.bool(),
    introDone: Joi.bool(),
    introSkipped: Joi.bool(),
    categoriesSetupDone: Joi.bool().optional().allow(null),
    picture: Joi.string().allow('', null).optional(),
    selectedCurrencyId: Joi.string().optional().allow(null, ''),
    deviceFCMToken: Joi.string().allow('', null).optional(),
    allowedNotifications: Joi.alt(Joi.string(), Joi.object()),
    preferredCategoriesIds: Joi.alternatives([
      Joi.array().items(Joi.string().uuid()).optional().allow(null),
      Joi.string().optional().allow(null),
    ]),
  }),
}
