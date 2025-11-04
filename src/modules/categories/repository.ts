import { fn, col, Op, Transaction } from 'sequelize'
import { GenericRepository } from '../../lib/base-repository.js'
import { Post } from '../posts/model.js'
import { Category } from './model.js'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { DatabaseConnection } from '../../database/index.js'
import { PostsRepository } from '../posts/repository.js'
import { Asset } from '../assets/model.js'
import { getDataFromCache, setDataInCache } from '../../api/middlewares/cache.js'

class CategoriesRepository extends GenericRepository<Category> {
  constructor() {
    super(Category)
  }

  public async getAllWithoutCount() {
    const cachedData = await getDataFromCache('categories')
    if (cachedData) {
      return JSON.parse(cachedData)
    }

    const categories = await Category.findAll({
      attributes: ['id', 'name', 'parentCategoryId'],
    })

    setDataInCache('categories', JSON.stringify(categories))
    return categories
  }

  // When removing a category, we are removing all the
  // posts from that category
  public async deleteCategory(categoryId: string) {
    return await DatabaseConnection.getInstance().transaction(async (transaction: Transaction) => {
      const postsWithThisCategory = await Post.findAll({
        attributes: ['id', 'mainCategoryId', 'subCategoryId'],
        where: {
          [Op.or]: {
            mainCategoryId: categoryId,
            subCategoryId: categoryId,
          },
        },
        transaction,
      })

      for (const postToDelete of postsWithThisCategory) {
        await PostsRepository.deletePost(postToDelete.id, transaction, false)
      }
      // We also need to remove all the subcategories
      await Category.destroy({
        where: { parentCategoryId: categoryId },
        transaction,
      })

      await Category.destroy({ where: { id: categoryId }, transaction })
    })
  }

  public async findAllWithPostsCount(): Promise<(Category & { postsCount: number })[]> {
    const categories = await Category.findAll({
      attributes: {
        include: [
          // Count of posts where the category is the main category
          [fn('COUNT', col('mainCategoryPosts.id')), 'mainCategoryPostCount'],
          // Count of Posts where the category is the sub category
          [fn('COUNT', col('subCategoryPosts.id')), 'subCategoryPostCount'],
        ],
        exclude: ['vectors'],
      },
      include: [
        {
          model: Asset,
          as: 'asset',
        },
        {
          model: Post,
          as: 'mainCategoryPosts',
          attributes: [],
          where: { expiresAt: { [Op.gt]: new Date() } },
          required: false,
        },
        {
          model: Post,
          as: 'subCategoryPosts',
          attributes: [],
          where: { expiresAt: { [Op.gt]: new Date() } },
          required: false,
        },
      ],
      group: [`${DATABASE_MODELS.CATEGORIES}.id`, `asset.id`],
      order: [['createdAt', 'ASC']],
    })

    return categories.map((category) => {
      const data = category.toJSON()
      delete data.vector

      data.postsCount = data.parentCategoryId
        ? data.subCategoryPostCount
        : data.mainCategoryPostCount

      delete data.mainCategoryPostCount
      delete data.subCategoryPostCount
      return data
    })
  }

  public async getVectorsForCategories(categoryIds: string[]) {
    const categories = await Category.findAll({
      where: { id: categoryIds },
      attributes: ['vector'],
    })

    return categories.map((category) => category.vector)
  }
}

const categoriesRepositoryInstance = new CategoriesRepository()
Object.freeze(categoriesRepositoryInstance)

export { categoriesRepositoryInstance as CategoriesRepository }
