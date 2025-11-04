import { Request, Response } from 'express'
import { GENERAL } from '../../constants/errors.js'
import { PostsRepository } from './repository.js'
import { Post } from './model.js'
import { FCMNotificationService } from '../../lib/notifications/index.js'
import { config } from '../../config.js'
import { SettingsRepository } from '../settings/repository.js'
import { PostSimilarityRepository } from '../post-similarities/repository.js'
import { PostMapClustersRepository } from '../post-map-clusters/repository.js'
import { TranslationManager } from '../../lib/translation-manager.js'
import { generateNameForAccount } from '../../lib/notifications/utils.js'
import { CurrenciesRepository } from '../currencies/repository.js'

export class PostsController {
  public static async create(req: Request, res: Response) {
    const { account } = res.locals
    const {
      latLng,
      location,
      title,
      description,
      hasCustomPrice = false,
      price,
      mainCategoryId,
      subCategoryId,
      youtubeLink,
      condition,
    } = req.body
    let { initialCurrencyId } = req.body

    try {
      if (!account.email) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      if (!location || !latLng) {
        return res.status(400).send({ error: GENERAL.BAD_REQUEST })
      }

      if (!initialCurrencyId || initialCurrencyId === 'null' || !initialCurrencyId.length) {
        if (account.selectedCurrencyId) {
          initialCurrencyId = account.selectedCurrencyId
        } else {
          const settings = await SettingsRepository.get()
          initialCurrencyId = settings.defaultCurrencyId
        }
      }

      const files = req.files as Express.Multer.File[]
      const [latitude, longitude] = JSON.parse(latLng)

      const initialPriceInDollars = await CurrenciesRepository.getPriceInDollars(
        price,
        initialCurrencyId
      )

      const newPost: Partial<Post> = {
        description,
        accountId: account.id,
        locationPretty: location,
        title,
        mainCategoryId,
        subCategoryId,
        hasCustomPrice,
        initialCurrencyId,
        locationLat: latitude,
        locationLong: longitude,
        initialPriceInDollars,
        price: price,
        youtubeLink,
        isNewItem: condition === 'new',
      }

      const post = await PostsRepository.createWithDetails(account.id, newPost, files)

      FCMNotificationService.sendNewPostFromFollowingAccount(account, post.id)

      PostMapClustersRepository.storeForPost(post.id)

      return res.status(200).json(post)
    } catch (error) {
      console.error('Cannot create post', error)
      if (error.message === GENERAL.NOT_ENOUGH_COINS) {
        return res.status(400).send({ error: GENERAL.NOT_ENOUGH_COINS })
      }
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async getLatest(req: Request, res: Response) {
    try {
      const posts = await PostsRepository.getLatest()
      return res.status(200).json(posts)
    } catch (error) {
      console.error('Cannot get latest posts', error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async getAllLocations(req: Request, res: Response) {
    try {
      const locations = await PostsRepository.findAllLocations()
      return res.status(200).json(locations)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async update(req: Request, res: Response) {
    const { account } = res.locals
    const { postId } = req.params
    const {
      latLng,
      location,
      title,
      description,
      hasCustomPrice = false,
      price,
      mainCategoryId,
      subCategoryId,
      youtubeLink,
      initialCurrencyId,
      condition,
    } = req.body

    try {
      if (!account.email) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      if (!location || !latLng) {
        return res.status(400).send({ error: GENERAL.BAD_REQUEST })
      }

      let initialPriceInDollars

      if (initialCurrencyId) {
        initialPriceInDollars = await CurrenciesRepository.getPriceInDollars(
          price,
          initialCurrencyId
        )
      }

      const postToUpdate = await Post.findByPk(postId)
      if (!postToUpdate) {
        throw new Error('Post not found')
      }

      if (postToUpdate.accountId !== account.id) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      const assetsToKeep =
        typeof req.body?.assetsToKeep === 'string' && req.body.assetsToKeep === ''
          ? []
          : typeof req.body?.assetsToKeep === 'string' && req.body?.assetsToKeep?.indexOf('[') === 0
          ? JSON.parse(req.body.assetsToKeep)
          : req.body.assetsToKeep

      const files = req.files as Express.Multer.File[]
      const [latitude, longitude] = JSON.parse(latLng)

      const postToUpdateData: Partial<Post> = {
        description,
        accountId: account.id,
        locationPretty: location,
        title,
        mainCategoryId,
        subCategoryId,
        hasCustomPrice,
        youtubeLink,
        locationLat: latitude,
        locationLong: longitude,
        price: price,
        isNewItem: condition === 'new',
        ...(initialCurrencyId && { initialCurrencyId }),
        ...(initialPriceInDollars && { initialPriceInDollars }),
      }

      const updatedPrice = await PostsRepository.updatePost(
        postId,
        postToUpdateData,
        files,
        assetsToKeep
      )

      try {
        await PostSimilarityRepository.updateSimilaritiesForPost(updatedPrice)
      } catch (error) {
        console.error('Could not update post similarities', error)
      }

      if (postToUpdate.price !== price) {
        FCMNotificationService.sendFavouritePostPriceChange(
          account,
          postToUpdate,
          postToUpdate.price,
          price
        )
      }

      PostMapClustersRepository.storeForPost(postId)

      PostsRepository.storeHistoryEvent(postId, 'update')

      return res.status(200).json(updatedPrice)
    } catch (error) {
      console.error('Cannot update post', error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async countForAccountByStatus(req: Request, res: Response) {
    const { status } = req.params
    const { account } = res.locals
    const { query = '' } = req.body

    try {
      if (status !== 'all' && status !== 'active' && status !== 'closed') {
        return res.status(500).send({ error: GENERAL.BAD_REQUEST })
      }

      const count = await PostsRepository.countForAccount(account.id, status, query)

      return res.status(200).json({ count })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async getAllForAccountByStatus(req: Request, res: Response) {
    const { account } = res.locals
    const { status } = req.params

    const {
      page = 0,
      perPage = 20,
      query = '',
      orderDirection = 'DESC',
      orderBy = 'createdAt',
    } = req.body

    try {
      if (status !== 'all' && status !== 'active' && status !== 'closed') {
        return res.status(500).send({ error: GENERAL.BAD_REQUEST })
      }

      const allPosts = await PostsRepository.findForAccount(account.id, status, {
        page,
        perPage,
        query,
        orderBy,
        orderDirection,
      })

      return res.status(200).json(allPosts)
    } catch (error) {
      console.error(error)
      return res.status(500).send({ error: GENERAL.BAD_REQUEST })
    }
  }

  public static async loadFilteredPosts(req: Request, res: Response) {
    const { account } = res.locals

    const {
      categories = [],
      subCategories = [],
      locationIds = [],
      activeOnly = false,
      includeMyPosts = true,
      promotedOnly = false,
      query = '',
      page = 0,
      perPage = 20,
      started = true,
      usedCurrencyId = null,
      orderDirection = 'DESC',
      orderBy = 'createdAt',
    } = req.body

    let { minPrice = 0, maxPrice = 0 } = req.body

    try {
      if (minPrice) {
        const minPriceIsNaN = Number.isNaN(parseInt(`${minPrice}`))
        if (minPriceIsNaN) {
          return res.status(500).send({ error: GENERAL.BAD_REQUEST })
        }

        minPrice = await CurrenciesRepository.getPriceInDollars(
          parseInt(`${minPrice}`),
          usedCurrencyId
        )
      }

      if (maxPrice) {
        const maxPriceIsNaN = Number.isNaN(parseInt(`${maxPrice}`))
        if (maxPriceIsNaN) {
          return res.status(500).send({ error: GENERAL.BAD_REQUEST })
        }

        maxPrice = await CurrenciesRepository.getPriceInDollars(
          parseInt(`${maxPrice}`),
          usedCurrencyId
        )
      }
    } catch (error) {
      return res.status(500).send({ error: GENERAL.BAD_REQUEST })
    }

    try {
      const posts = await PostsRepository.loadFilteredPosts(
        typeof categories === 'string' ? JSON.parse(categories) : categories,
        typeof subCategories === 'string' ? JSON.parse(subCategories) : subCategories,
        typeof locationIds === 'string' ? JSON.parse(locationIds) : locationIds,
        activeOnly,
        {
          page,
          perPage,
          query,
          orderBy,
          orderDirection,
        },
        includeMyPosts === false ? account.id : undefined,
        minPrice,
        maxPrice,
        undefined,
        promotedOnly,
        started
      )

      return res.status(200).json(posts)
    } catch (error) {
      console.error('Cannot load filtered posts', error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async getByLocationProximity(req: Request, res: Response) {
    const { lat, lng, mainCategoryId, maxDistance = 5 } = req.params
    try {
      const parsableDistance = parseInt(`${maxDistance}`)
      if (Number.isNaN(parsableDistance)) {
        return res.status(500).send({ error: GENERAL.BAD_REQUEST })
      }
    } catch (error) {
      return res.status(500).send({ error: GENERAL.BAD_REQUEST })
    }

    try {
      const distanceToParse = parseInt(`${maxDistance}`)
      if (distanceToParse > 200) {
        return res.status(500).send({ error: GENERAL.BAD_REQUEST })
      }

      const allPosts = await PostsRepository.findByLocationProximity(
        parseFloat(lat),
        parseFloat(lng),
        mainCategoryId,
        distanceToParse
      )

      return res.status(200).json(allPosts)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async countFilteredPosts(req: Request, res: Response) {
    const { account } = res.locals

    const {
      categories = [],
      subCategories = [],
      locationIds = [],
      activeOnly = false,
      includeMyPosts = true,
      query = '',
      usedCurrencyId = null,
    } = req.body

    let { minPrice = 0, maxPrice = 0 } = req.body

    try {
      if (minPrice) {
        const minPriceIsNaN = Number.isNaN(parseInt(`${minPrice}`))
        if (minPriceIsNaN) {
          return res.status(500).send({ error: GENERAL.BAD_REQUEST })
        }

        minPrice = await CurrenciesRepository.getPriceInDollars(
          parseInt(`${minPrice}`),
          usedCurrencyId
        )
      }

      if (maxPrice) {
        const maxPriceIsNaN = Number.isNaN(parseInt(`${maxPrice}`))
        if (maxPriceIsNaN) {
          return res.status(500).send({ error: GENERAL.BAD_REQUEST })
        }

        maxPrice = await CurrenciesRepository.getPriceInDollars(
          parseInt(`${maxPrice}`),
          usedCurrencyId
        )
      }
    } catch (error) {
      return res.status(500).send({ error: GENERAL.BAD_REQUEST })
    }

    try {
      const count = await PostsRepository.applyFilterQueryOverPosts({
        categories: typeof categories === 'string' ? JSON.parse(categories) : categories,
        subCategories:
          typeof subCategories === 'string' ? JSON.parse(subCategories) : subCategories,
        locationIds: typeof locationIds === 'string' ? JSON.parse(locationIds) : locationIds,
        activeOnly,
        query,
        ...(includeMyPosts === false && { accountIdToIgnore: account ? account.id : undefined }),
        minPrice,
        maxPrice,
        getCount: true,
      })

      return res.status(200).json({ count })
    } catch (error) {
      console.error('Cannot count filtered posts', error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async translatePostDetails(req: Request, res: Response) {
    const { postId, lang } = req.params

    try {
      const post = await Post.findByPk(postId)
      if (!post) {
        return res.status(500).send({ error: GENERAL.BAD_REQUEST })
      }

      const { title, description } = post
      const [translatedTitle, translatedDescription] = await Promise.all([
        TranslationManager.translate(title, lang),
        TranslationManager.translate(description, lang),
      ])

      return res.status(200).json({ title: translatedTitle, description: translatedDescription })
    } catch (error) {
      console.error('Cannot translate post details', error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async search(req: Request, res: Response) {
    const { keyword, page = 0, perPage = 10 } = req.params
    if (!keyword) {
      res.status(500).send({ error: GENERAL.BAD_REQUEST })
      return
    }

    try {
      const posts = await PostsRepository.search({
        query: keyword,
        page: parseInt(page.toString()),
        perPage: parseInt(perPage.toString()),
      })

      return res.status(200).json(posts)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async countActiveByAccount(req: Request, res: Response) {
    const { accountId } = req.params
    const { query = '' } = req.body

    try {
      const count = await PostsRepository.applyFilterQueryOverPosts({
        categories: [],
        subCategories: [],
        locationIds: [],
        activeOnly: true,
        query,
        accountId,
        getCount: true,
      })

      return res.status(200).json({ count })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async getActiveByAccount(req: Request, res: Response) {
    const { accountId } = req.params

    const {
      page = 0,
      perPage = 20,
      query = '',
      orderDirection = 'DESC',
      orderBy = 'createdAt',
    } = req.body

    try {
      const allPosts = await PostsRepository.loadFilteredPosts(
        [],
        [],
        [],
        true,
        {
          page,
          perPage,
          query,
          orderBy,
          orderDirection,
        },
        undefined,
        undefined,
        undefined,
        accountId
      )

      return res.status(200).json(allPosts)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async getManySummary(req: Request, res: Response) {
    const { postIds } = req.body

    try {
      const summary = await PostsRepository.getManySummary(postIds)
      if (!summary) {
        return res.status(500).send({ error: GENERAL.BAD_REQUEST })
      }

      return res.status(200).json(summary)
    } catch (error) {
      console.error('Cannot get many post summary', error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async getSummary(req: Request, res: Response) {
    const { postId } = req.params

    try {
      const summary = await PostsRepository.getSummary(postId)
      if (!summary) {
        return res.status(500).send({ error: GENERAL.BAD_REQUEST })
      }

      return res.status(200).json(summary)
    } catch (error) {
      console.error('Cannot get post summary', error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async getDetails(req: Request, res: Response) {
    const { account } = res.locals
    try {
      const { postId } = req.params
      const post = await PostsRepository.getDetails(postId)
      if (!post) {
        return res.status(500).send({ error: GENERAL.BAD_REQUEST })
      }

      if (account?.id !== post.accountId) {
        if (account) {
          PostsRepository.storeHistoryEvent(postId, 'view', {
            accountName: generateNameForAccount(account),
            accountId: account.id,
          })
        }
        Post.increment('views', { by: 1, where: { id: postId } })
        post.views += 1
      }

      delete post.vectors

      return res.status(200).json(post)
    } catch (error) {
      console.error('Cannot get post details', error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async closePost(req: Request, res: Response) {
    const { account } = res.locals
    const { postId } = req.params

    try {
      const post = await Post.findByPk(postId)
      if (!post) {
        return res.status(500).send({ error: GENERAL.BAD_REQUEST })
      }

      if (post.accountId !== account.id) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      if (post.markedAsClosedAt) {
        return res.status(500).send({ error: GENERAL.BAD_REQUEST })
      }

      await PostsRepository.closePost(postId)

      PostsRepository.storeHistoryEvent(postId, 'mark-as-closed')

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Cannot close post', error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async promotePost(req: Request, res: Response) {
    const { account } = res.locals
    const { postId } = req.params

    try {
      const [post, settings] = await Promise.all([
        PostsRepository.getOneById(postId),
        SettingsRepository.get(),
      ])
      if (!post) {
        return res.status(500).send({ error: GENERAL.BAD_REQUEST })
      }

      if (post.accountId !== account.id) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      const promotionCost = settings.promotionCoinsCost ?? config.PROMOTE_POST_COINS_COST

      if (account.coins - promotionCost < 0) {
        return res.status(500).send({ error: GENERAL.NOT_ENOUGH_COINS })
      }

      await PostsRepository.promotePost(postId, account.id, promotionCost)

      PostsRepository.storeHistoryEvent(postId, 'promote')
      return res.status(200).json({ success: true })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async delete(req: Request, res: Response) {
    const { account } = res.locals
    const { postId } = req.params
    try {
      if (!account.email) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }
      const post = await PostsRepository.getOneById(postId)
      if (post?.accountId !== account.id) {
        return res.status(500).send({ error: GENERAL.FORBIDDEN })
      }

      await PostsRepository.deletePost(postId)
      PostMapClustersRepository.storeForPost(postId)

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Cannot delete post', error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }
}
