import { DatabaseConnection } from '../../database/index.js'
import { Account } from '../../modules/accounts/model.js'
import { Asset } from '../../modules/assets/model.js'
import { AssetsRepository } from '../../modules/assets/repository.js'
import { PostAsset } from '../../modules/auxiliary-models/post-assets.js'
import { customComponents } from '../component-loader.js'
import { Op } from 'sequelize'
import { uploadFile } from '../utils/multer.js'
import fs from 'fs'
import { Category } from '../../modules/categories/model.js'

export const createAssetResource = () => {
  return {
    resource: Asset,
    options: {
      navigation: {
        name: 'General',
        icon: 'Home',
      },
      properties: {
        actualAsset: {
          isVisible: { list: true, filter: false, show: true, edit: false },
          components: {
            list: customComponents.AssetImage,
            show: customComponents.AssetImage,
          },
          isVirtual: true,
        },
        sizeInMB: {
          isVisible: { list: true, filter: false, show: true, edit: false },
          isVirtual: true,
          type: 'string',
          components: {
            list: customComponents.AssetSize,
            show: customComponents.AssetSize,
          },
        },
        assetDropzone: {
          isVisible: {
            list: false,
            filter: false,
            show: false,
            edit: true,
          },
          isVirtual: true,
          type: 'string',
          components: {
            edit: customComponents.AssetDropzone,
          },
        },
      },
      listProperties: ['actualAsset', 'id', 'path', 'size', 'sizeInMB', 'createdAt'],
      editProperties: ['assetDropzone'],
      showProperties: ['actualAsset', 'id', 'path', 'size', 'sizeInMB', 'createdAt'],
      filterProperties: ['id', 'path', 'createdAt', 'updatedAt'],
      actions: {
        edit: {
          isAccessible: false,
          isVisible: false,
        },
        new: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
          actionType: 'resource',
          isVisible: true,
          handler: createAssetAction,
          component: customComponents.AssetDropzone,
        },
        delete: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
          actionType: 'record',
          handler: deleteAssetAction,
        },
        bulkDelete: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
          actionType: 'bulk',
          handler: deleteBulkAssets,
        },
      },
    },
  }
}

const deleteBulkAssets = async (request, response, context) => {
  const { records } = context
  const assetIds = records.map((record) => record.id()) as string[]
  const recordsInJSON = records.map((record) => record.toJSON(context.currentAdmin))

  if (request.method !== 'post') {
    return {
      records: recordsInJSON,
    }
  }

  const transaction = await DatabaseConnection.getInstance().transaction()

  try {
    await PostAsset.destroy({
      where: { assetId: { [Op.in]: assetIds } },
      transaction,
    })
    await Account.update(
      { assetId: null },
      { where: { assetId: { [Op.in]: assetIds } }, transaction }
    )
    await Category.update(
      { assetId: null },
      { where: { assetId: { [Op.in]: assetIds } }, transaction }
    )

    for (const assetId of assetIds) {
      await AssetsRepository.removeAsset(assetId, transaction)
    }

    await transaction.commit()
    return {
      records: recordsInJSON,
      notice: {
        message: 'Assets were deleted successfully',
        type: 'success',
      },
      redirectUrl: '/admin/resources/assets',
    }
  } catch (error) {
    try {
      await transaction.rollback()
    } catch (err) {
      console.error('Could not rollback transaction', err)
    }
    return {
      records: recordsInJSON,
      notice: {
        message: `There was an error deleting the record(s): ${error.message}`,
        type: 'error',
      },
    }
  }
}

const deleteAssetAction = async (request, response, context) => {
  const { record } = context
  const assetId = record.params.id
  const transaction = await DatabaseConnection.getInstance().transaction()

  try {
    // Remove the asset from any post
    await PostAsset.destroy({ where: { assetId }, transaction })
    // Remove the asset from any account
    await Account.update({ assetId: null }, { where: { assetId }, transaction })
    // Remove the asset from any category
    await Category.update({ assetId: null }, { where: { assetId }, transaction })
    // Remove the asset from the database and from the storage
    await AssetsRepository.removeAsset(assetId, transaction)

    await transaction.commit()
    return {
      record: record.toJSON(context.currentAdmin),
      notice: {
        message: 'Asset was deleted successfully',
        type: 'success',
      },
      redirectUrl: '/admin/resources/assets',
    }
  } catch (error) {
    try {
      await transaction.rollback()
    } catch (err) {
      console.error('Could not rollback transaction', err)
    }
    return {
      record: record.toJSON(context.currentAdmin),
      notice: {
        message: `There was an error deleting the record: ${error.message}`,
        type: 'error',
      },
    }
  }
}

const createAssetAction = async (request, response) => {
  if (request.method !== 'post') {
    return { notice: 'Method must be POST', type: 'error' }
  }

  const expressReq = {
    ...request,
    headers: {
      ...request.headers,
      'content-type': 'multipart/form-data',
    },
  }

  try {
    const file = (await uploadFile(expressReq, response)) as Express.Multer.File

    if (!file.buffer) {
      const content = fs.readFileSync(file.path)
      file.buffer = content
    }

    await AssetsRepository.storeAsset(file)

    return {
      redirectUrl: '/admin/resources/assets',
      notice: {
        message: 'Asset uploaded successfully!',
        type: 'success',
      },
    }
  } catch (error) {
    return {
      notice: { message: 'No file uploaded.', type: 'error' },
    }
  }
}
