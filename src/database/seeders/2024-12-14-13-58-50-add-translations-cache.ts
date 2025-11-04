import sequelize from 'sequelize'
import { TranslationCache } from '../../modules/auxiliary-models/translations-cache.js'

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()
  const translationsData = await import('../translations-data/index.js')
  try {
    await TranslationCache.bulkCreate(translationsData.TRANSLATIONS_CACHE, { transaction })
    await transaction.commit()
  } catch (error) {
    console.error(error)
    await transaction.rollback()
    throw error
  }
}

export async function down({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await TranslationCache.destroy({ where: {}, transaction })
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
