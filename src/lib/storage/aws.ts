import { DeleteObjectCommand, PutObjectCommand, S3 } from '@aws-sdk/client-s3'
import { config } from '../../config.js'
import { v4 as uuidv4 } from 'uuid'
import { compressFile } from './utils.js'
import jimp from 'jimp'
import { ExpressFile, StorageHandler } from './types.js'
import { Response } from 'express'
import { SettingsRepository } from '../../modules/settings/repository.js'

export class AWSStorage implements StorageHandler {
  async getS3() {
    const settings = await SettingsRepository.get()
    const region = settings?.awsStorageRegion || config.AWS_STORAGE.REGION
    const accessKeyId = settings?.awsAccessKeyId || config.AWS_STORAGE.ACCESS_KEY_ID
    const secretAccessKey = settings?.awsSecretAccessKey || config.AWS_STORAGE.SECRET_ACCESS_KEY

    return new S3({
      region,
      credentials: accessKeyId
        ? {
            accessKeyId,
            secretAccessKey,
          }
        : undefined,
    })
  }

  async upload(file: ExpressFile) {
    const s3 = await this.getS3()
    if (!s3) {
      throw new Error('AWS S3 client not initialized')
    }

    try {
      file.filename = uuidv4()
      file.mimetype = file.mimetype ?? jimp.MIME_JPEG

      let buffer = file.buffer
      try {
        buffer = await compressFile(file.buffer, file.mimetype)
      } catch (error) {
        console.error(`Could not compress file: ${error}`)
      }
      const bucketName = await this.getBucketName()

      const uploadParams = {
        Bucket: bucketName,
        Key: file.filename,
        Body: buffer,
        ContentType: file.mimetype,
      }

      const command = new PutObjectCommand(uploadParams)
      await s3.send(command)

      return file
    } catch (error) {
      console.error(`Could not upload file to aws: ${error}`)
    }
  }

  async delete(path: string) {
    const s3 = await this.getS3()
    if (!s3) {
      throw new Error('AWS S3 client not initialized')
    }
    const bucketName = await this.getBucketName()
    try {
      const deleteParams = {
        Bucket: bucketName,
        Key: path,
      }

      const command = new DeleteObjectCommand(deleteParams)
      await s3.send(command)
    } catch (error) {
      console.error(`Could not delete file from aws: ${error}`)
      throw error
    }
  }

  async sendToClient(path: string, res: Response) {
    const url = await this.getFileUrl(path)
    res.redirect(url)
  }

  async getFileUrl(path: string) {
    const bucketName = await this.getBucketName()
    return `https://${bucketName}.s3.amazonaws.com/${path}`
  }

  private async getBucketName() {
    const settings = await SettingsRepository.get()
    return settings?.awsStorageBucket || config.AWS_STORAGE.BUCKET || ''
  }
}
