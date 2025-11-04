import sequelize from 'sequelize'
import { VectorsManager } from '../../lib/vectors-manager.js'
import { Category } from '../../modules/categories/model.js'

export async function up({
  context: queryInterface,
}: {
  context: sequelize.QueryInterface
}) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    const categories = await Category.findAll({ transaction })
    for (const category of categories) {
      const vector = await VectorsManager.createVectorFromString(
        category.name?.['en']
          ? category.name['en']
          : Object.values(category.name)[0]
      )

      console.info(`Updating category ${category.name?.['en']} vector`)
      await Category.update(
        { vector },
        { where: { id: category.id }, transaction }
      )
    }

    await transaction.commit()
  } catch (error) {
    console.error(error)
    await transaction.rollback()
    throw error
  }
}

export async function down({
  context: queryInterface,
}: {
  context: sequelize.QueryInterface
}) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
