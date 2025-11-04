import { Request, Response } from 'express'
import { fileTypeFromBuffer } from 'file-type'
import { config } from '../../config.js'
import { ASSET_ERRORS } from '../../constants/errors.js'
import { IMAGE_EXTENSIONS } from '../../constants/image-extensions.js'

export const valdiateFilesInRequest = async (
  req: Request,
  res: Response,
  next
) => {
  const files = req.files as Express.Multer.File[]
  if (!files || !files.length) {
    return next()
  }

  if (files.length > config.MAX_ALLOWED_ASSETS) {
    return res.status(403).send({ TOO_MANY: ASSET_ERRORS.TOO_MANY })
  }

  for (const file of files) {
    const { ext, mime } = await fileTypeFromBuffer(file.buffer)
    const mimetype = mime.split('/').pop()

    if (file.size > config.MAX_ASSET_SIZE) {
      return res.status(403).send({ ASSET_TOO_BIG: ASSET_ERRORS.TOO_BIG })
    }

    if (
      !IMAGE_EXTENSIONS.includes(mimetype) ||
      !IMAGE_EXTENSIONS.includes(ext.toLowerCase())
    ) {
      return res
        .status(403)
        .send({ ASSET_NOT_SUPPORTED: ASSET_ERRORS.ASSET_TYPE_NOT_SUPPORTED })
    }
  }

  return next()
}

export const validateMaxAssetsCountInRequest = (count: number) => {
  return (req: Request, res: Response, next) => {
    const files = req.files as Express.Multer.File[]
    if (!files || !files.length) {
      return next()
    }

    if (files.length > count) {
      return res.status(403).send({ TOO_MANY: ASSET_ERRORS.TOO_MANY })
    }

    return next()
  }
}
