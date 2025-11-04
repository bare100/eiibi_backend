import { Request, Response } from 'express'
import { GENERAL } from '../../constants/errors.js'
import { CategoriesRepository } from './repository.js'
import { Category } from './model.js'

type CategoryResultItem = Partial<Category> & { subcategories: Category[] }

export class CategoriesController {
  public static async getAll(req: Request, res: Response) {
    try {
      const allCategories = await CategoriesRepository.findAllWithPostsCount()

      const result = allCategories.reduce((acc: CategoryResultItem[], category) => {
        if (category.parentCategoryId) {
          const parentCategory = acc.find((item) => item.id === category.parentCategoryId)
          if (parentCategory) {
            parentCategory.subcategories.push(category)
          }
        } else {
          acc.push({
            ...category,
            subcategories: [],
          } as CategoryResultItem)
        }

        return acc
      }, [])
      return res.status(200).json(result)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }
}
