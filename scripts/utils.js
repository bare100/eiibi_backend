export const getCurrentYYYYMMDDHHmms = () => {
  const date = new Date()
  return date.toISOString().substr(0, 19).replace('T', '-').replace(/:/g, '-')
}

export const SEED_MIGRATION_BASE = `import sequelize from 'sequelize';

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    // Make sure you add your up seed/migration here and use the above created transaction if necessary

    await transaction.commit()
  } catch(error) {
    console.error(error)
    await transaction.rollback()
    throw error
  }
}

export async function down({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    // Make sure you add your down seed/migration here and use the above created transaction if necessary
    
    await transaction.commit()
  } catch(error) {
    await transaction.rollback()
    throw error
  }
}
`

export const generateNewLanguageBase = (lang) => `import sequelize from 'sequelize';
import Translator from 'open-google-translator'
import { Category } from '../../modules/categories/model.js'
import { NotificationContent } from '../../modules/auxiliary-models/notification-content.js'
import { Currency } from '../../modules/currencies/model.js'

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    const allCategories = await Category.findAll()
    for (const category of allCategories) {
      const translations = await Translator.TranslateLanguageData({
        listOfWordsToTranslate: [category.name.en, ...(category.details ? [category.details.en] : [])],
        fromLanguage: 'en',
        toLanguage: '${lang}',
      })
      const translatedName = translations[0].translation
      category.name['${lang}'] = translatedName

      if(category.details) {
        const translatedDetails = translations[1].translation
        if(translatedDetails) {
          category.details['${lang}'] = translatedDetails
        }
      }

      await Category.update(
        { name: category.name, details: category.details },
        { where: { id: category.id }, transaction }
      )
    }

    const notificationsContent = await NotificationContent.findAll()
    for (const notificationContent of notificationsContent) {
      const translations = await Translator.TranslateLanguageData({
        listOfWordsToTranslate: [notificationContent.title.en, notificationContent.description.en],
        fromLanguage: 'en',
        toLanguage: '${lang}',
      })
      const translatedTitle = translations[0].translation
      const translatedDescription = translations[1].translation
      notificationContent.title['${lang}'] = translatedTitle
      notificationContent.description['${lang}'] = translatedDescription
      
      await NotificationContent.update(
        { title: notificationContent.title, description: notificationContent.description },
        { where: { type: notificationContent.type }, transaction }
      )
    }

    const allCurrencies = await Currency.findAll()
    for (const currency of allCurrencies) {
      const translations = await Translator.TranslateLanguageData({
        listOfWordsToTranslate: [currency.name.en],
        fromLanguage: 'en',
        toLanguage: '${lang}',
      })
      const translatedName = translations[0].translation
      currency.name['${lang}'] = translatedName

      await Currency.update(
        { name: currency.name },
        { where: { id: currency.id }, transaction }
      )
    }
    await transaction.commit()
  } catch(error) {
    console.error(error)
    await transaction.rollback()
    throw error
  }
}

export async function down({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    // Make sure you add your down seed/migration here and use the above created transaction if necessary
    
    await transaction.commit()
  } catch(error) {
    await transaction.rollback()
    throw error
  }
}
`
