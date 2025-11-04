import { Storage } from '@google-cloud/storage'
import { config } from '../../config.js'
import { v4 as uuidv4 } from 'uuid'
import jimp from 'jimp'
import { compressFile } from './utils.js'
import { ExpressFile, StorageHandler } from './types.js'
import { Response } from 'express'
import { SettingsRepository } from '../../modules/settings/repository.js'

export class GoogleStorage implements StorageHandler {
  constructor() {}

  async getBucket() {
    const bucketName = await this.getBucketName()
    if (!bucketName) {
      console.error('Google Cloud Storage bucket is not provided')
      return null
    }
    const googleCloudStorage = new Storage({
      keyFilename: 'service-account.json',
    })
    const bucket = googleCloudStorage.bucket(bucketName ?? '')
    return bucket
  }

  async upload(file: ExpressFile) {
    try {
      file.filename = uuidv4()
      file.mimetype = file.mimetype ?? jimp.MIME_JPEG

      let buffer = file.buffer
      try {
        buffer = await compressFile(file.buffer, file.mimetype)
      } catch (error) {
        console.error(`Could not compress file: ${error}`)
      }

      const bucket = await this.getBucket()
      if (!bucket) {
        console.error('Google Cloud Storage bucket is not provided')
        return null
      }

      await bucket.file(`${file.filename}`).save(buffer, {
        metadata: {
          gzip: true,
          contentType: file.mimetype,
          cacheControl: 'public, max-age=172800', // cache for 2 days
        },
        resumable: false,
      })
      return file
    } catch (error) {
      console.error(`Could not upload file: ${error}`)
    }
  }

  async delete(path: string) {
    try {
      const bucket = await this.getBucket()
      if (!bucket) {
        console.error('Google Cloud Storage bucket is not provided')
        return null
      }
      await bucket.file(`${path}`).delete()
    } catch (error) {
      console.error(`Could not delete file: ${error}`)
    }
  }

  async sendToClient(path: string, res: Response) {
    const bucketName = await this.getBucketName()
    if (!bucketName) {
      console.error('Google Cloud Storage bucket is not provided')
      return res.status(500).send('Google Cloud Storage bucket is not provided')
    }

    const url = `https://storage.googleapis.com/${bucketName}/${path}`
    res.redirect(url)
  }

  async getFileUrl(path: string) {
    const bucketName = await this.getBucketName()
    return `https://storage.googleapis.com/${bucketName}/${path}`
  }

  private async getBucketName() {
    const settings = await SettingsRepository.get()
    return settings?.googleCloudStorageBucket || config.GCLOUD_STORAGE.BUCKET
  }
}
