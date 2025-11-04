import { schedule } from 'node-cron'
import { Account } from '../../modules/accounts/model.js'
import { PostsRepository } from '../../modules/posts/repository.js'
import { CategoriesRepository } from '../../modules/categories/repository.js'
import { DEFAULT_POSTS_DATA, DefaultPostData, IMAGES_STORAGE_PREFIX } from './constants.js'
import { Asset } from '../../modules/assets/model.js'
import { AssetsRepository } from '../../modules/assets/repository.js'
import { Transaction } from 'sequelize'
import { DatabaseConnection } from '../../database/index.js'
import { Location } from '../../modules/auxiliary-models/location.js'
import { Category } from '../../modules/categories/model.js'
import { Post } from '../../modules/posts/model.js'
import { PostAsset } from '../../modules/auxiliary-models/post-assets.js'
import { PostSimilarityRepository } from '../../modules/post-similarities/repository.js'
import { PostMapClustersRepository } from '../../modules/post-map-clusters/repository.js'
import { SettingsRepository } from '../../modules/settings/repository.js'
import { Settings } from '../../modules/settings/model.js'
import { config } from '../../config.js'
import { CurrenciesRepository } from '../../modules/currencies/repository.js'

// This CRON will run only if the "RUN_IN_DEMO_MODE" environment variable is set to "true".
// This is going to create a few posts every hour, if the number of active posts
// is smaller than 50. Do not do this if you are running the app in production

// If you want to automatically create posts in the demo mode,
// you also need to add "DEMO_MAIN_ACCOUNT_EMAIL" environment variable.
// This will point to the user that will be used to create the posts.
export const runDemovePostsCron = () => {
  if (process.env.RUN_IN_DEMO_MODE !== 'true') {
    return
  }

  // Adding default posts on start
  addDefaultPosts()

  schedule('0 * * * *', () => {
    console.log('Running demo posts cron')
    addDefaultPosts()
  })
}

const addDefaultPosts = async () => {
  try {
    const accountForPostsEmail = process.env.DEMO_MAIN_ACCOUNT_EMAIL
    const accountForPosts = await Account.findOne({
      where: {
        email: accountForPostsEmail,
      },
    })

    if (!accountForPosts) {
      console.log('Could not find the account for default posts')
      return
    }

    const activePostsCount = await getActivePostsCount()
    if (activePostsCount >= 50) {
      return
    }

    const allCategories = await CategoriesRepository.findAll({})
    if (!allCategories) {
      console.error('Could not find any categories')
      return
    }

    console.info('Adding default posts to the database')
    // Sorting the posts list randomly, so the posts are not created in the same order
    const randomlySortedPostsData = DEFAULT_POSTS_DATA.sort(() => Math.random() - 0.5)

    const transaction = await DatabaseConnection.getInstance().transaction()
    let count = 1
    try {
      const settings = await SettingsRepository.get()
      for (const postToCreate of randomlySortedPostsData) {
        await createPost(postToCreate, allCategories, accountForPosts, settings, transaction)
        count += 1
      }

      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  } catch (error) {
    console.error('Could not add default posts', error)
  }
}

const createPost = async (
  postToCreate: DefaultPostData,
  allCategories: Category[],
  accountForPosts: Account,
  settings: Settings,
  transaction: Transaction
) => {
  const postId = await getPostIdFromAssetName(postToCreate.assetName, transaction)
  if (!postId) {
    const error = `Could not find asset for post ${postToCreate.assetName}`
    throw new Error(error)
  }

  const mainCategoryId = allCategories.find(
    (category) =>
      category.name.en.toLowerCase() === postToCreate.mainCategory.toLowerCase() &&
      !category.parentCategoryId
  )?.id
  if (!mainCategoryId) {
    throw new Error(`Could not find category for post ${postToCreate.mainCategory}`)
  }
  const subCategoryId = allCategories.find(
    (category) =>
      category.name.en.toLowerCase() === postToCreate.subCategory.toLowerCase() &&
      !!category.parentCategoryId
  )?.id

  if (!subCategoryId) {
    const error = `Could not find sub category for post ${postToCreate.subCategory}`
    throw new Error(error)
  }

  let location = await Location.findOne({
    where: {
      name: postToCreate.location,
    },
    transaction,
  })

  if (!location) {
    location = await Location.create({ name: postToCreate.location }, { transaction })
  }

  const currencies = await CurrenciesRepository.getAll()
  const usdCurrency = currencies.find((currency) => currency.code === 'USD')
  if (!usdCurrency) {
    throw new Error('USD currency not found')
  }

  // 1 in 10 chanches this is true
  const needToPromote = Math.random() < 0.1

  const expirationDate = new Date()
  expirationDate.setDate(
    expirationDate.getDate() + (settings?.postActiveTimeInDays ?? config.POST_ACTIVE_TIME_IN_DAYS)
  )

  const postData = {
    assetId: postId,
    mainCategoryId,
    subCategoryId,
    locationId: location.id,
    locationPretty: postToCreate.location,
    locationLat: postToCreate.latLng.latitude,
    locationLong: postToCreate.latLng.longitude,
    initialCurrencyId: usdCurrency.id,
    initialPriceInDollars: postToCreate.price,
    title: postToCreate.title,
    isNewItem: true,
    description: '',
    hasCustomPrice:
      postToCreate.price !== 5 && postToCreate.price !== 10 && postToCreate.price !== 15,
    price: postToCreate.price,
    accountId: accountForPosts.id,
    vectors: {},
    expiresAt: expirationDate,
  }

  const postVector = await PostsRepository.generateVectorForPost(postData, transaction)
  postData.vectors = postVector

  // Create the actual post
  const createdPost = await Post.create(postData, {
    transaction,
    returning: true,
  })

  await PostAsset.create({ assetId: postId, postId: createdPost.id }, { transaction })

  if (needToPromote) {
    createdPost.promotedAt = new Date()
  }

  await createdPost.save({ transaction })

  await PostMapClustersRepository.storeForPost(createdPost.id, transaction, false)

  await PostSimilarityRepository.updateSimilaritiesForPost(createdPost, transaction, false)
}

const getPostIdFromAssetName = async (name: string, transaction: Transaction) => {
  const existingAsset = await Asset.findOne({
    where: { initialName: name },
    transaction,
  })
  if (existingAsset) {
    return existingAsset.id
  }

  const downloadedAsset = await downloadAssetFromPath(`${IMAGES_STORAGE_PREFIX}/${name}`)

  const mimetypeFromName = name.split('.').pop()
  const multerFile = bufferToMulterFile(downloadedAsset, name, mimetypeFromName)
  const createdAsset = await AssetsRepository.storeAsset(
    multerFile as Express.Multer.File,
    transaction
  )

  return createdAsset.id
}

const getActivePostsCount = async () => {
  const count = await PostsRepository.applyFilterQueryOverPosts({
    categories: [],
    subCategories: [],
    locationIds: [],
    activeOnly: true,
    query: undefined,
    getCount: true,
  })

  return typeof count === 'number' ? count : count.count
}

const downloadAssetFromPath = async (path: string) => {
  try {
    const response = await fetch(path)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}: ${response.statusText}`)
    }

    // Read the file data into a buffer
    const buffer = await response.arrayBuffer()
    return Buffer.from(buffer) // Convert to Buffer
  } catch (error) {
    console.error(`Error downloading file: ${error.message}`)
    throw error
  }
}

function bufferToMulterFile(buffer, originalname, mimetype) {
  return {
    fieldname: 'file',
    originalname: originalname,
    encoding: '7bit',
    mimetype: mimetype,
    size: buffer.length,
    buffer: buffer,
    destination: '',
    filename: '',
    path: '',
  }
}
