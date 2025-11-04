import { ExpressFile, StorageHandler } from './types.js'
import { v4 as uuidv4 } from 'uuid'
import jimp from 'jimp'
import { compressFile, generateDiskUploadsDir } from './utils.js'
import { extname, join } from 'path'
import { access, existsSync, mkdirSync, unlink, writeFile } from 'fs'
import { Response } from 'express'

export class DiskStorage implements StorageHandler {
  async upload(file: ExpressFile) {
    try {
      const fileExtension = extname(file.originalname)
      file.filename = uuidv4() + fileExtension
      file.mimetype = file.mimetype ?? jimp.MIME_JPEG

      let buffer = file.buffer
      try {
        buffer = await compressFile(file.buffer, file.mimetype)
      } catch (error) {
        console.error(`Could not compress file: ${error}`)
      }

      const uploadsDir = generateDiskUploadsDir()
      if (!existsSync(uploadsDir)) {
        console.info(`Uploads folder does not exist. Creating it now: ${uploadsDir}`)
        mkdirSync(uploadsDir, { recursive: true })
      }

      const assetPath = join(uploadsDir, file.filename)

      return new Promise<ExpressFile>((resolve, reject) => {
        writeFile(assetPath, buffer, (error) => {
          if (error) {
            return reject(error)
          }

          return resolve(file)
        })
      })
    } catch (error) {
      console.error(`Could not save file to disk: ${error}`)
    }
  }

  async delete(path: string) {
    const assetPath = join(generateDiskUploadsDir(), path)

    return new Promise<void>((resolve, reject) => {
      unlink(assetPath, (error) => {
        if (error) {
          return reject(error)
        }

        return resolve()
      })
    })
  }

  sendToClient(path: string, res: Response) {
    const uploadsDir = generateDiskUploadsDir()
    const assetPath = join(uploadsDir, path)

    access(assetPath, (error) => {
      if (error) {
        console.error(`Could not access file: ${error}`)
        res.status(404).send('File not found')
      } else {
        res.sendFile(assetPath)
      }
    })
  }

  async getFileUrl(path: string) {
    return path
  }
}
