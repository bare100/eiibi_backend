import { Post } from '../../modules/posts/model.js'
import { customComponents } from '../component-loader.js'
import { PostsRepository } from '../../modules/posts/repository.js'
import { DatabaseConnection } from '../../database/index.js'
import { loadAssetsForPosts } from '../utils/loaders.js'

export const createPostResource = () => {
  return {
    resource: Post,
    options: {
      navigation: {
        name: 'General',
        icon: 'Home',
      },
      properties: {
        mainCategoryId: {
          type: 'string',
          components: {
            list: customComponents.PostCategoryCard,
            show: customComponents.PostCategoryCard,
          },
        },
        subCategoryId: {
          type: 'string',
          components: {
            list: customComponents.PostCategoryCard,
            show: customComponents.PostCategoryCard,
          },
        },
        initialCurrencyId: {
          components: {
            show: customComponents.JsonbField,
            list: customComponents.JsonbFieldList,
            edit: customComponents.SimpleInput,
          },
        },
        assets: {
          components: {
            show: customComponents.PostAssets,
            edit: customComponents.PostAssets,
          },
        },
        postAssets: {
          isVirtual: true,
          components: {
            list: customComponents.PostAssetsCarousel,
          },
        },
      },
      editProperties: [
        'assets',
        'mainCategoryId',
        'subCategoryId',
        'title',
        'description',
        'isNewItem',
        'initialPriceInDollars',
        'initialCurrencyId',
        'price',
        'promotedAt',
        'youtubeLink',
      ],
      filterProperties: [
        'id',
        'accountId',
        'locationPretty',
        'mainCategoryId',
        'subCategoryId',
        'title',
        'description',
        'isNewItem',
        'price',
        'hasCustomPrice',
        'paidCoins',
        'coinsPaidBack',
        'markedAsClosedAt',
        'promotedAt',
        'createdAt',
        'updatedAt',
      ],
      listProperties: [
        'postAssets',
        'accountId',
        'locationPretty',
        'mainCategoryId',
        'title',
        'views',
        'price',
        'createdAt',
        'promotedAt',
      ],
      showProperties: [
        'assets',
        'id',
        'accountId',
        'locationPretty',
        'locationLat',
        'locationLong',
        'mainCategoryId',
        'subCategoryId',
        'initialCurrencyId',
        'initialPriceInDollars',
        'title',
        'description',
        'youtubeLink',
        'views',
        'isNewItem',
        'price',
        'hasCustomPrice',
        'paidCoins',
        'coinsPaidBack',
        'markedAsClosedAt',
        'promotedAt',
        'createdAt',
        'updatedAt',
      ],
      actions: {
        new: {
          isVisible: false,
          isAccessible: false,
        },
        delete: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
          handler: deletePost,
          guard: 'All the data related to this post will be removed! ',
        },
        bulkDelete: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
          actionType: 'bulk',
          handler: deleteBulkPosts,
        },
        show: {
          before: loadAssetsForPostRecord,
        },
        edit: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
          before: loadAssetsForPostRecord,
        },
        list: {
          after: loadAssetsForAllPosts,
        },
      },
    },
  }
}

const loadAssetsForAllPosts = async (response, request, context) => {
  const { records } = response
  if (records && records.length > 0) {
    const postIds = records.map((record) => record.id)
    const assets = await loadAssetsForPosts(postIds)

    assets.forEach((asset) => {
      const matchingRecord = records.find((record) => record.id === asset.postId)

      if (!matchingRecord.params.assets) {
        matchingRecord.params.assets = []
      }
      if (matchingRecord) {
        matchingRecord.params.assets.push(asset.asset)
      }
    })
  }
  return response
}

const loadAssetsForPostRecord = async (request, context) => {
  const { record } = context
  delete record.vectors

  const itemId = record.id()
  if (record && record.id) {
    const assets = await loadAssetsForPosts(itemId)
    context.record.params.assets = assets.map((el) => el.asset)
  }
  return request
}

const deleteBulkPosts = async (request, response, context) => {
  const { records } = context
  const postIds = records.map((record) => record.id()) as string[]
  const recordsInJSON = records.map((record) => record.toJSON(context.currentAdmin))

  if (request.method !== 'post') {
    return {
      records: recordsInJSON,
    }
  }

  const transaction = await DatabaseConnection.getInstance().transaction()

  try {
    for (const postId of postIds) {
      await PostsRepository.deletePost(postId, transaction, false)
    }
    await transaction.commit()

    return {
      records: recordsInJSON,
      notice: {
        message: 'Posts were deleted successfully',
        type: 'success',
      },
      redirectUrl: '/admin/resources/posts',
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
        message: `There was an error deleting the records: ${error.message}`,
        type: 'error',
      },
    }
  }
}

const deletePost = async (request, response, context) => {
  const { record } = context
  const postId = record.params.id

  try {
    await PostsRepository.deletePost(postId)

    return {
      record: record.toJSON(context.currentAdmin),
      notice: {
        message: 'Post was deleted successfully',
        type: 'success',
      },
      redirectUrl: '/admin/resources/posts',
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
