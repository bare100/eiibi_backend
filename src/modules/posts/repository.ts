import { Op, Transaction, literal } from 'sequelize'
import { GenericRepository } from '../../lib/base-repository.js'
import { Post } from './model.js'
import { DatabaseConnection } from '../../database/index.js'
import { PostAsset } from '../auxiliary-models/post-assets.js'
import { Asset } from '../assets/model.js'
import { Favourite } from '../favourites/model.js'
import { Location } from '../auxiliary-models/location.js'
import { config } from '../../config.js'
import { Account } from '../accounts/model.js'
import { AssetsRepository } from '../assets/repository.js'
import { PaginatedQueryParams } from '../../types.js'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { LastSeenPost } from '../last-seen/model.js'
import { VectorsManager } from '../../lib/vectors-manager.js'
import { Category } from '../categories/model.js'
import { PostSimilarity } from '../post-similarities/model.js'
import { Literal } from 'sequelize/types/utils.js'
import { SettingsRepository } from '../settings/repository.js'
import { PostSimilarityRepository } from '../post-similarities/repository.js'
import { GENERAL } from '../../constants/errors.js'
import { CoinsRefunder } from '../../lib/coins-refunder.js'
import { PostHistoryEvent } from '../auxiliary-models/post-history-events.js'
import { ChatGroupPost } from '../auxiliary-models/chat-group-posts.js'
import { PostMapCluster } from '../post-map-clusters/model.js'
import { Comment } from '../comments/entity.js'

interface ApplyFilterQueryOverPostsParams {
  categories: string[]
  subCategories: string[]
  locationIds: string[]
  activeOnly: boolean
  getCount?: boolean
  accountIdToIgnore?: string
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
  minPrice?: number
  maxPrice?: number
  query?: string
  accountId?: string
  promotedOnly?: boolean
}

class PostsRepository extends GenericRepository<Post> {
  constructor() {
    super(Post)
  }

  public async getManySummary(postIds: string[]) {
    return await Post.findAll({
      where: { id: { [Op.in]: postIds } },
      include: [
        {
          model: Account,
          attributes: ['id', 'name', 'email', 'picture', 'verified'],
        },
        { model: Asset, as: 'postAssets', required: false },
      ],
    })
  }

  public async getSummary(postId: string) {
    return await Post.findByPk(postId, {
      include: [
        { model: Asset, as: 'postAssets' },
        {
          model: Account,
          attributes: ['id', 'name', 'email', 'picture', 'verified'],
        },
      ],
    })
  }

  public async findByIds(ids: string[], transaction?: Transaction) {
    return await Post.findAll({
      where: { id: { [Op.in]: ids } },
      include: [
        {
          model: Account,
          attributes: ['id', 'name', 'email', 'picture', 'verified'],
        },
        { model: Asset, as: 'postAssets' },
      ],
      transaction,
    })
  }

  public async createWithDetails(
    accountId: string,
    post: Partial<Post>,
    assets: Express.Multer.File[] = []
  ) {
    return await DatabaseConnection.getInstance().transaction(async (transaction: Transaction) => {
      const { locationPretty } = post

      // We need to check if the account has enough coins to create the post
      const [settings, postsFromSameAccount] = await Promise.all([
        SettingsRepository.get(),
        Post.count({
          where: { accountId: post.accountId },
          transaction,
        }),
      ])

      const { freePostsCount, postsCoinsCost } = settings

      if (postsFromSameAccount >= freePostsCount) {
        const account = await Account.findByPk(accountId, { transaction })
        if (account.coins < postsCoinsCost) {
          throw new Error(GENERAL.NOT_ENOUGH_COINS)
        }

        account.coins -= postsCoinsCost
        await account.save({ transaction })

        post.paidCoins = postsCoinsCost
      }

      // If the location does not exist inside the database,
      // we are going to create it
      let location = await Location.findOne({
        where: {
          name: locationPretty,
        },
        transaction,
      })

      if (!location) {
        location = await Location.create({ name: locationPretty }, { transaction })
      }

      post.locationId = location.id

      try {
        const postVector = await this.generateVectorForPost(post, transaction)

        post.vectors = postVector
      } catch (error) {
        console.error('Could not create post vector while creating post', error)
      }

      const expirationDate = new Date()
      expirationDate.setDate(
        expirationDate.getDate() +
          (settings?.postActiveTimeInDays ?? config.POST_ACTIVE_TIME_IN_DAYS)
      )
      post.expiresAt = expirationDate

      // Create the actual post
      const createdPost = await Post.create(post, {
        transaction,
        returning: true,
      })

      await this.storePostAssets(assets, createdPost.id, transaction)

      const postDetails = await this.findByIds([createdPost.id], transaction)
      const resultPost = postDetails[0]

      await PostSimilarityRepository.updateSimilaritiesForPost(resultPost, transaction, false)

      return resultPost
    })
  }

  public async getLatest() {
    const POSTS_TO_TAKE = 12

    // Check if there are more that POSTS_TO_TAKE promoted posts.
    // If there are, we are going to show only promoted posts, in a random order
    const promotedPostsCount = await Post.count({
      where: {
        promotedAt: { [Op.ne]: null },
        expiresAt: { [Op.gte]: new Date() },
        markedAsClosedAt: null,
      },
    })

    if (promotedPostsCount > POSTS_TO_TAKE) {
      const posts = await Post.findAll({
        order: literal('RANDOM()'),
        attributes: { exclude: ['vectors'] },
        where: {
          promotedAt: { [Op.ne]: null },
          expiresAt: { [Op.gte]: new Date() },
          markedAsClosedAt: null,
        },
        include: [
          {
            model: Account,
            attributes: ['id', 'name', 'email', 'picture', 'verified'],
          },
          { model: Asset, as: 'postAssets' },
        ],
        limit: POSTS_TO_TAKE,
      })

      return posts
    }

    const orderConditions: (string | [string | Literal, string])[] = []
    orderConditions.push(
      [literal('(CASE WHEN "promotedAt" IS NOT NULL THEN 1 ELSE 0 END)'), 'DESC'],
      ['promotedAt', 'DESC'],
      ['createdAt', 'DESC']
    )

    const posts = await Post.findAll({
      order: orderConditions,
      attributes: { exclude: ['vectors'] },
      where: {
        expiresAt: { [Op.gte]: new Date() },
        markedAsClosedAt: null,
      },
      include: [
        {
          model: Account,
          attributes: ['id', 'name', 'email', 'picture', 'verified'],
        },
        { model: Asset, as: 'postAssets' },
      ],
      limit: POSTS_TO_TAKE,
    })

    return posts
  }

  public async updatePost(
    postId: string,
    newPostData: Partial<Post>,
    newAssets: Express.Multer.File[],
    assetsToKeepIds: string[] = []
  ) {
    assetsToKeepIds = [].concat(assetsToKeepIds)

    return await DatabaseConnection.getInstance().transaction(async (transaction: Transaction) => {
      try {
        const postVector = await this.generateVectorForPost(newPostData, transaction)

        newPostData.vectors = postVector
      } catch (error) {
        console.error('Could not create post vector while updating post', error)
      }

      const updateResult = await Post.update(newPostData, {
        where: { id: postId },
        returning: true,
        transaction,
      })

      const updatedpost = updateResult[1][0]

      const postAssetsToDestroy = await PostAsset.findAll({
        where: { postId, assetId: { [Op.notIn]: assetsToKeepIds } },
        transaction,
      })

      const assetIdsToDestroy = postAssetsToDestroy.map((el) => el.assetId)
      const assetsToDestroy = await Asset.findAll({
        where: { id: { [Op.in]: assetIdsToDestroy } },
        transaction,
      })

      await PostAsset.destroy({
        where: { postId, assetId: { [Op.notIn]: assetsToKeepIds } },
        transaction,
      })

      await Promise.all([
        ...assetsToDestroy.map((el) => AssetsRepository.removeAssetFromStorage(el.path)),

        Asset.destroy({
          where: { id: { [Op.in]: assetIdsToDestroy } },
          transaction,
        }),
      ])

      await this.storePostAssets(newAssets, updatedpost.id, transaction, false)

      return updatedpost
    })
  }

  public async search(paginationParams: PaginatedQueryParams) {
    const { query, page, perPage } = paginationParams

    return await Post.findAll({
      limit: perPage,
      offset: page * perPage,
      attributes: { exclude: ['vectors'] },
      order: [['createdAt', 'DESC']],
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } },
        ],
      },
      include: [
        {
          model: Account,
          attributes: ['id', 'name', 'email', 'picture', 'verified'],
        },
        { model: Asset, as: 'postAssets' },
      ],
    })
  }

  public async storeHistoryEvent(
    postId: string,
    type: string,
    details: Record<string, unknown> = {}
  ) {
    await PostHistoryEvent.create({ postId, type, details })
  }

  public async closePost(postId: string) {
    await Post.update({ markedAsClosedAt: new Date() }, { where: { id: postId } })
  }

  public async promotePost(postId: string, accountId: string, cost: number) {
    return await DatabaseConnection.getInstance().transaction(async (transaction: Transaction) => {
      await Post.update({ promotedAt: new Date() }, { where: { id: postId }, transaction })

      await Account.decrement('coins', {
        where: { id: accountId },
        by: cost,
        transaction,
      })
    })
  }

  public async getDetails(postId: string) {
    const post = await Post.findByPk(postId, {
      // Include the count of the favourites for this post
      attributes: {
        include: [
          [
            literal(
              `(SELECT COUNT(*) FROM ${DATABASE_MODELS.ACCOUNT_FAVOURITES} WHERE "postId" = "${DATABASE_MODELS.POSTS}"."id")`
            ),
            'likesCount',
          ],
        ],
      },
      include: [
        {
          model: Account,
          attributes: ['id', 'name', 'email', 'picture', 'verified'],
          include: [{ model: Asset, as: 'asset' }],
        },
        { model: Asset, as: 'postAssets' },
        { model: PostHistoryEvent, as: 'postHistoryEvents', order: [['createdAt', 'DESC']] },
      ],
    })

    return post.toJSON()
  }

  public async deletePost(postId: string, transaction?: Transaction, commitTransaction = true) {
    transaction = transaction || (await DatabaseConnection.getInstance().transaction())

    try {
      await CoinsRefunder.handleDeletePostRefund(postId, transaction)

      // We need to remove all the related data
      await Favourite.destroy({ where: { postId }, transaction })

      await LastSeenPost.destroy({ where: { postId }, transaction })

      await this.removePostAssets(postId, transaction)

      await Comment.destroy({ where: { postId }, transaction })

      await PostHistoryEvent.destroy({ where: { postId }, transaction })

      await ChatGroupPost.destroy({ where: { postId }, transaction })

      await Post.destroy({ where: { id: postId }, transaction })

      await PostSimilarity.destroy({
        where: { [Op.or]: { postId1: postId, postId2: postId } },
        transaction,
      })

      await PostMapCluster.destroy({ where: { id: postId }, transaction })

      if (commitTransaction) {
        await transaction.commit()
      }
    } catch (error) {
      if (commitTransaction) {
        console.error('Coult not commit transaction - delete post', error)
        await transaction.rollback()
      } else {
        throw error
      }
    }
  }

  public async countForAccount(
    accountId: string,
    status: 'closed' | 'active' | 'all',
    query?: string
  ) {
    let extraQuery = {}
    switch (status) {
      case 'closed':
        extraQuery = {
          [Op.or]: [
            { expiresAt: { [Op.lt]: new Date() } },
            { markedAsClosedAt: { [Op.ne]: null } },
          ],
        }
        break
      case 'active':
        extraQuery = {
          [Op.and]: [{ expiresAt: { [Op.gte]: new Date() } }, { markedAsClosedAt: null }],
        }
        break
    }

    const QUERY_WHERE_STMT = query
      ? {
          where: {
            [Op.or]: [literal(`"title" ILIKE $1`), literal(`"description" ILIKE $1`)],
          },
        }
      : {}

    return await Post.count({
      where: { ...extraQuery, ...QUERY_WHERE_STMT, accountId },
      include: [],
      ...(query ? { bind: [`%${query}%`] } : {}),
    })
  }

  public async findForAccount(
    accountId: string,
    status: 'closed' | 'active' | 'all',
    params?: PaginatedQueryParams
  ) {
    const {
      page = 0,
      perPage = 20,
      orderDirection = 'DESC',
      orderBy = 'createdAt',
      query,
    } = params || {}

    let extraQuery = {}
    switch (status) {
      case 'closed':
        extraQuery = {
          [Op.or]: [
            { expiresAt: { [Op.lt]: new Date() } },
            { markedAsClosedAt: { [Op.ne]: null } },
          ],
        }
        break
      case 'active':
        extraQuery = {
          [Op.and]: [{ expiresAt: { [Op.gte]: new Date() } }, { markedAsClosedAt: null }],
        }
        break
    }

    const QUERY_WHERE_STMT = query
      ? {
          where: {
            [Op.or]: [literal(`"title" ILIKE $1`), literal(`"description" ILIKE $1`)],
          },
        }
      : {}

    const needToAddPromotionOrder =
      orderBy === 'createdAt' && orderDirection?.toLowerCase() === 'desc'

    const orderConditions: (string | [string | Literal, string])[] = []
    if (needToAddPromotionOrder) {
      orderConditions.push(
        [literal('(CASE WHEN "promotedAt" IS NOT NULL THEN 1 ELSE 0 END)'), 'DESC'],
        ['promotedAt', 'DESC'],
        [orderBy, orderDirection]
      )
    } else {
      orderConditions.push([orderBy, orderDirection])
    }

    const posts = await Post.findAll({
      where: { ...extraQuery, ...QUERY_WHERE_STMT, accountId },
      limit: perPage,
      offset: page * perPage,
      attributes: { exclude: ['vectors'] },
      order: orderConditions,
      include: [
        { model: Asset, as: 'postAssets', required: false },
        {
          model: Account,
          attributes: ['id', 'name', 'email', 'picture', 'verified'],
        },
      ],
      ...(query ? { bind: [`%${query}%`] } : {}),
    })

    return posts
  }

  public async findByLocationProximity(
    lat: number,
    lng: number,
    mainCategoryId: string,
    maxDistanceInKM = 5
  ) {
    // 6371 - earth radius in km
    const QUERY_FOR_POSTS = `
      SELECT id FROM (
        SELECT  id,
          (
            6371 
            * acos(cos(radians($lat)) 
            * cos(radians("locationLat")) 
            * cos(radians("locationLong") - radians($lng)) 
            + sin(radians($lat)) 
            * sin(radians("locationLat")) 
          )
        )
        AS distance
        FROM posts
        WHERE "expiresAt" >= NOW() 
          ${mainCategoryId !== 'all' ? 'AND "mainCategoryId" = $mainCategoryId' : ''}
          AND "markedAsClosedAt" IS NULL
        ) al
      WHERE distance <= $maxDistanceInKM
      ORDER BY distance
    `
    const [posts] = await DatabaseConnection.getInstance().query(QUERY_FOR_POSTS, {
      raw: true,
      bind: { maxDistanceInKM, lat, lng, mainCategoryId },
    })
    const postIds = posts.map((el) => el.id)
    return this.findByIds(postIds)
  }

  public async loadFilteredPosts(
    categories: string[],
    subCategories: string[],
    locationIds: string[],
    activeOnly: boolean,
    params: PaginatedQueryParams,
    accountIdToIgnore?: string,
    minPrice?: number,
    maxPrice?: number,
    accountId?: string,
    promotedOnly?: boolean,
    started = true
  ) {
    const { page, perPage, orderDirection = 'DESC', orderBy = 'createdAt', query } = params

    const postIdsToSelect = await this.applyFilterQueryOverPosts({
      categories,
      subCategories,
      locationIds,
      accountIdToIgnore,
      activeOnly,
      getCount: false,
      orderBy,
      orderDirection,
      minPrice,
      maxPrice,
      promotedOnly,
    })

    const QUERY_WHERE_STMT = query
      ? {
          [Op.or]: [
            { title: { [Op.iLike]: `%${query}%` } },
            { description: { [Op.iLike]: `%${query}%` } },
          ],
        }
      : {}

    const ACCOUNT_WHERE_STMS = accountId
      ? { accountId }
      : accountIdToIgnore
      ? { accountId: { [Op.ne]: accountIdToIgnore } }
      : {}

    const needToAddPromotionOrder =
      orderBy === 'createdAt' && orderDirection?.toLowerCase() === 'desc'

    const orderConditions: (string | [string | Literal, string])[] = []
    if (needToAddPromotionOrder) {
      if (started === false) {
        orderConditions.push(['startAt', 'ASC'])
      }

      orderConditions.push(
        [literal('(CASE WHEN "promotedAt" IS NOT NULL THEN 1 ELSE 0 END)'), 'DESC'],
        ['promotedAt', 'DESC'],
        [orderBy, orderDirection]
      )
    } else {
      orderConditions.push([orderBy, orderDirection])
    }

    const posts = await Post.findAll({
      limit: perPage,
      offset: page * perPage,
      order: orderConditions,
      attributes: { exclude: ['vectors'] },
      where: {
        id: {
          [Op.in]:
            typeof postIdsToSelect !== 'number' ? postIdsToSelect.rows.map((el) => el.id) : [],
        },
        ...QUERY_WHERE_STMT,
        ...ACCOUNT_WHERE_STMS,
      },
      include: [
        { model: Asset, as: 'postAssets', required: false },
        {
          model: Account,
          attributes: ['id', 'name', 'email', 'picture', 'verified'],
        },
      ],
    })

    return posts
  }

  public async findAllLocations() {
    const QUERY = `
      SELECT "${DATABASE_MODELS.LOCATIONS}"."id", "name", COALESCE(COUNT("name"), 0) as "postsCount"
      FROM "${DATABASE_MODELS.LOCATIONS}"
      LEFT JOIN "${DATABASE_MODELS.POSTS}" ON "${DATABASE_MODELS.POSTS}"."locationId" = "${DATABASE_MODELS.LOCATIONS}"."id" 
        AND "expiresAt" >= NOW()
        AND "markedAsClosedAt" IS NULL
      GROUP BY "${DATABASE_MODELS.LOCATIONS}"."id","name"
    `
    const [result] = await DatabaseConnection.getInstance().query(QUERY, {
      raw: true,
    })

    return result
  }

  public async applyFilterQueryOverPosts(params: ApplyFilterQueryOverPostsParams) {
    const {
      categories,
      subCategories,
      locationIds,
      activeOnly,
      accountIdToIgnore,
      orderBy,
      orderDirection,
      minPrice,
      maxPrice,
      getCount,
      accountId,
      query,
      promotedOnly = false,
    } = params

    if (
      orderDirection &&
      orderDirection.toUpperCase() !== 'ASC' &&
      orderDirection.toUpperCase() !== 'DESC'
    ) {
      throw new Error('Invalid params')
    }

    if (orderBy && orderBy !== 'createdAt' && orderBy !== 'price') {
      throw new Error('Invalid params')
    }

    const QUERY_WHERE_STMT = query
      ? {
          [Op.or]: [
            { title: { [Op.iLike]: `%${query}%` } },
            { description: { [Op.iLike]: `%${query}%` } },
          ],
        }
      : {}

    const PROMOTED_STMT = promotedOnly
      ? {
          promotedAt: {
            [Op.ne]: null,
          },
        }
      : {}

    const PRICE_WHERE_STMT =
      minPrice || maxPrice
        ? {
            price: {
              [Op.and]: {
                ...(minPrice && { [Op.gte]: minPrice }),
                ...(maxPrice && { [Op.lte]: maxPrice }),
              },
            },
          }
        : {}

    const whereStatement = {
      ...QUERY_WHERE_STMT,
      ...(activeOnly && {
        [Op.and]: { expiresAt: { [Op.gte]: new Date() }, markedAsClosedAt: null },
      }),
      ...(categories?.length && { mainCategoryId: { [Op.in]: categories } }),
      ...(subCategories?.length && {
        subCategoryId: { [Op.in]: subCategories },
      }),
      ...(locationIds?.length && { locationId: { [Op.in]: locationIds } }),
      ...(accountIdToIgnore && { accountId: { [Op.ne]: accountIdToIgnore } }),
      ...PRICE_WHERE_STMT,
      ...PROMOTED_STMT,
      ...(accountId && { accountId }),
    }

    return getCount
      ? Post.count({ where: whereStatement })
      : Post.findAndCountAll({
          where: whereStatement,
          order: orderBy ? [[orderBy, orderDirection]] : [['createdAt', 'DESC']],
        })
  }

  private async removePostAssets(postId: string, transaction: Transaction) {
    const postAssets = await PostAsset.findAll({
      where: { postId },
      transaction,
    })

    if (!postAssets.length) {
      return
    }

    await PostAsset.destroy({ where: { postId }, transaction })

    for (const asset of postAssets) {
      await AssetsRepository.removeAsset(asset.assetId, transaction)
    }
  }

  private async storePostAssets(
    assets: Express.Multer.File[],
    postId: string,
    transaction: Transaction,
    cleanupBefore = true
  ) {
    if (cleanupBefore) {
      await this.removePostAssets(postId, transaction)
    }

    const storedAssets = [] as Asset[]
    for (const asset of assets) {
      const createdAsset = await AssetsRepository.storeAsset(asset, transaction)
      if (createdAsset) {
        storedAssets.push(createdAsset)

        await PostAsset.create({ assetId: createdAsset.id, postId }, { transaction })
      }
    }
  }

  async generateVectorForPost(post: Partial<Post>, transaction: Transaction) {
    const { mainCategoryId, subCategoryId } = post
    const [mainCategory, subCategory] = await Promise.all([
      Category.findByPk(mainCategoryId, { transaction }),
      Category.findByPk(subCategoryId, { transaction }),
    ])

    try {
      return await VectorsManager.createPostVector(post, mainCategory, subCategory)
    } catch (error) {
      console.error('Could not create post vector', error)
      return {}
    }
  }
}

const postsRepositoryInstance = new PostsRepository()
Object.freeze(postsRepositoryInstance)

export { postsRepositoryInstance as PostsRepository }
