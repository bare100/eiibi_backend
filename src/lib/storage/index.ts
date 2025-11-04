import { config } from '../../config.js'
import { SettingsRepository } from '../../modules/settings/repository.js'
import { AWSStorage } from './aws.js'
import { DiskStorage } from './disk.js'
import { GoogleStorage } from './google.js'
import { ExpressFile } from './types.js'
import { Response } from 'express'

class AssetStorageHandler {
  async getHandler() {
    const storageType = await this.getStorageType()
    if (storageType === 'google') {
      return new GoogleStorage()
    }

    if (storageType === 'aws') {
      return new AWSStorage()
    }

    return new DiskStorage()
  }

  async getStorageType() {
    const settings = await SettingsRepository.get()
    const gCloudBucket = settings?.googleCloudStorageBucket || config.GCLOUD_STORAGE.BUCKET
    if (!!gCloudBucket?.length) {
      return 'google'
    }

    const awsAccessKeyId = settings?.awsAccessKeyId || config.AWS_STORAGE.ACCESS_KEY_ID
    const awsSecretAccessKey = settings?.awsSecretAccessKey || config.AWS_STORAGE.SECRET_ACCESS_KEY
    const awsStorageBucket = settings?.awsStorageBucket || config.AWS_STORAGE.BUCKET
    const awsStorageRegion = settings?.awsStorageRegion || config.AWS_STORAGE.REGION

    if (
      awsAccessKeyId?.length &&
      awsSecretAccessKey?.length &&
      awsStorageBucket?.length &&
      awsStorageRegion?.length
    ) {
      return 'aws'
    }

    return 'disk'
  }

  async upload(file: ExpressFile) {
    const handler = await this.getHandler()
    return handler.upload(file)
  }

  async delete(path: string) {
    const handler = await this.getHandler()
    return handler.delete(path)
  }

  async serveFile(path: string, res: Response) {
    const handler = await this.getHandler()
    return handler.sendToClient(path, res)
  }

  async getFileUrl(path: string) {
    const handler = await this.getHandler()
    return handler.getFileUrl(path)
  }
}

const storageHandler = new AssetStorageHandler()
Object.freeze(storageHandler)

export { storageHandler as AssetStorageHandler }
