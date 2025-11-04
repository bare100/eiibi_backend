import Joi from 'joi'
import { NextFunction, Request, Response } from 'express'
import { GENERAL } from '../../constants/errors.js'

export const validateHttpRequest = (
  schema:
    | Joi.ObjectSchema
    | {
        joiSchema: Joi.ObjectSchema
        authorize: (req: Request, res: Response) => any
      }
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    let joiSchema = schema
    // @ts-ignore
    if (schema.authorize) {
      // @ts-ignore
      joiSchema = schema.joiSchema
    }

    // @ts-ignore
    const { error, value } = joiSchema.validate(req.body)

    if (error) {
      const message = error.details.map((i) => i.message).join(',')
      // eslint-disable-next-line no-console
      console.info('Validation error', message, req.body)
      return res.status(422).send({ error: message })
    }

    req.body = value

    //@ts-ignore
    if (schema.authorize) {
      try {
        // @ts-ignore
        const isAuthorized = await schema.authorize(req, res)
        if (!isAuthorized) {
          return res.status(403).send({ error: GENERAL.FORBIDDEN })
        }
      } catch (error) {
        console.error(error)
        return res
          .status(GENERAL.SOMETHING_WENT_WRONG_CODE)
          .send({ error: GENERAL.SOMETHING_WENT_WRONG })
      }
    }

    next()
  }
}
