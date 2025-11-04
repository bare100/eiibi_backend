import { GenericRepository } from '../../lib/base-repository.js'
import { Asset } from './model.js'
import { Transaction } from 'sequelize'
import { AssetStorageHandler } from '../../lib/storage/index.js'

class AssetsRepository extends GenericRepository<Asset> {
  constructor() {
    super(Asset)
  }

  public async storeAsset(asset: Express.Multer.File, transaction?: Transaction) {
    const resultFile = await AssetStorageHandler.upload(asset)
    if (!resultFile) {
      return null
    }

    const { filename, size } = resultFile
    const assetData = new Asset({
      path: filename,
      size,
      initialName: asset.filename,
    })

    return await assetData.save({ transaction })
  }

  public async removeAsset(assetId: string, transaction: Transaction) {
    const asset = await this.getOneById(assetId, transaction)
    if (!asset) {
      return
    }

    await this.removeAssetFromStorage(asset.path)
    return await this.deleteById(assetId, transaction)
  }

  public async removeAssetFromStorage(path: string) {
    try {
      await AssetStorageHandler.delete(path)
    } catch (error) {
      console.error('Could not remove asset from disk', error)
    }
  }
}

const assetRepositoryInstance = new AssetsRepository()
Object.freeze(assetRepositoryInstance)

export { assetRepositoryInstance as AssetsRepository }
