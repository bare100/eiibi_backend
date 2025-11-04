import { DatabaseConnection } from '../../database/index.js'
import { AssetsRepository } from '../../modules/assets/repository.js'
import { Category } from '../../modules/categories/model.js'
import { CategoriesRepository } from '../../modules/categories/repository.js'
import { customComponents } from '../component-loader.js'
import { uploadFile } from '../utils/multer.js'
import fs from 'fs'

export const createCategoryResource = () => {
  return {
    resource: Category,
    options: {
      properties: {
        id: {
          type: 'string',
          isVisible: {
            filter: true,
            show: true,
            edit: false,
            list: true,
          },
        },
        parentCategoryId: {
          components: {
            filter: customComponents.AllCategoriesSelect,
            show: customComponents.ParentCategoryNameWithLabel,
            list: customComponents.ParentCategoryName,
            edit: customComponents.CustomCategorySelect,
          },
        },
        details: {
          components: {
            show: customComponents.JsonbField,
            list: customComponents.JsonbFieldList,
            edit: customComponents.TranslatedValue,
          },
        },
        name: {
          type: 'string',
          components: {
            show: customComponents.JsonbField,
            list: customComponents.JsonbFieldList,
            edit: customComponents.TranslatedValue,
          },
          isVisible: { filter: true },
        },
        remoteIconUrl: {
          type: 'string',
          components: {
            list: customComponents.CustomCategoryIconList,
          },
        },
        assetId: {
          type: 'string',
          components: {
            edit: customComponents.CustomCategoryIconEdit,
            list: customComponents.CategoryUploadedIcon,
          },
        },
      },
      navigation: {
        name: 'General',
        icon: 'Home',
      },
      listProperties: [
        'parentCategoryId',
        'name',
        'details',
        'icon',
        'remoteIconUrl',
        'assetId',
        'createdAt',
      ],
      showProperties: [
        'id',
        'name',
        'details',
        'parentCategoryId',
        'icon',
        'remoteIconUrl',
        'assetId',
        'createdAt',
        'updatedAt',
      ],
      editProperties: ['name', 'details', 'icon', 'remoteIconUrl', 'assetId', 'parentCategoryId'],
      filterProperties: [
        'id',
        'parentCategoryId',
        'icon',
        'remoteIconUrl',
        'assetId',
        'createdAt',
        'updatedAt',
      ],
      actions: {
        bulkDelete: {
          isVisible: false,
          isAccessible: false,
        },
        new: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
        },
        delete: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
          handler: deleteCategory,
          guard:
            'It is not a good idea to remove a category. All the posts assigned to this category will be removed as well. Do you want this?',
        },
        edit: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
        },
        uploadCustomIcon: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
          isVisible: false,
          type: 'record',
          handler: uploadCustomIconAction,
        },
        removeIcon: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
          isVisible: false,
          type: 'record',
          handler: deleteIconFromCategory,
        },
      },
    },
  }
}

const deleteIconFromCategory = async (request, response, context) => {
  const { record } = context
  const categoryId = record.params.id

  try {
    await Category.update({ assetId: null }, { where: { id: categoryId } })
    return {
      record: record.toJSON(context.currentAdmin),
      notice: {
        message: 'Icon was deleted successfully',
        type: 'success',
      },
    }
  } catch (error) {
    return {
      record: record.toJSON(context.currentAdmin),
      notice: {
        message: `There was an error deleting the icon: ${error.message}`,
        type: 'error',
      },
    }
  }
}

const deleteCategory = async (request, response, context) => {
  const { record } = context
  const categoryId = record.params.id

  try {
    await CategoriesRepository.deleteCategory(categoryId)

    return {
      record: record.toJSON(context.currentAdmin),
      notice: {
        message: 'Category was deleted successfully',
        type: 'success',
      },
      redirectUrl: '/admin/resources/categories',
    }
  } catch (error) {
    return {
      record: record.toJSON(context.currentAdmin),
      notice: {
        message: `There was an error deleting the record: ${error.message}`,
        type: 'error',
      },
    }
  }
}

const uploadCustomIconAction = async (request, response, context) => {
  const categoryId = request.payload.categoryId

  const expressReq = {
    ...request,
    headers: {
      ...request.headers,
      'content-type': 'multipart/form-data',
    },
  }

  const transaction = await DatabaseConnection.getInstance().transaction()

  try {
    const file = (await uploadFile(expressReq, response)) as Express.Multer.File

    if (!file.buffer) {
      const content = fs.readFileSync(file.path)
      file.buffer = content
    }

    const uploadedAsset = await AssetsRepository.storeAsset(file, transaction)

    await Category.update(
      {
        assetId: uploadedAsset.id,
      },
      { where: { id: categoryId }, transaction }
    )
    await transaction.commit()

    return {
      notice: {
        message: 'Icon uploaded successfully!',
        type: 'success',
      },
    }
  } catch (error) {
    return {
      notice: { message: 'No file uploaded.', type: 'error' },
    }
  }
}
