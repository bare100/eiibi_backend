import sequelize from 'sequelize'
import Translator, { LanguageCode } from 'open-google-translator'
import { Category } from '../../modules/categories/model.js'
import { NotificationContent } from '../../modules/auxiliary-models/notification-content.js'
import { Currency } from '../../modules/currencies/model.js'
import { TranslationCache } from '../../modules/auxiliary-models/translations-cache.js'

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  const allTranslationsCache = await TranslationCache.findAll()

  const getTranslation = async (fromLanguage: string, toLanguage: string, initialText: string) => {
    const translation = allTranslationsCache.find(
      (translation) =>
        translation.fromLanguage === fromLanguage &&
        translation.toLanguage === toLanguage &&
        translation.initialText === initialText
    )
    if (translation) {
      return translation.translatedText
    }

    const translations = await Translator.TranslateLanguageData({
      listOfWordsToTranslate: [initialText],
      fromLanguage: fromLanguage as LanguageCode,
      toLanguage: toLanguage as LanguageCode,
    })
    const translatedText = translations[0].translation
    await TranslationCache.create({
      fromLanguage,
      toLanguage,
      initialText,
      translatedText,
    })
    return translatedText
  }

  try {
    const allCategories = await Category.findAll()
    for (const category of allCategories) {
      const name = await getTranslation('en', 'ru', category.name.en)
      category.name['ru'] = name

      if (category.details) {
        const details = await getTranslation('en', 'ru', category.details.en)
        if (details) {
          category.details['ru'] = details
        }
      }

      await Category.update(
        { name: category.name, details: category.details },
        { where: { id: category.id }, transaction }
      )
    }

    const notificationsContent = await NotificationContent.findAll()
    for (const notificationContent of notificationsContent) {
      const title = await getTranslation('en', 'ru', notificationContent.title.en)
      const description = await getTranslation('en', 'ru', notificationContent.description.en)
      notificationContent.title['ru'] = title
      notificationContent.description['ru'] = description

      await NotificationContent.update(
        { title: notificationContent.title, description: notificationContent.description },
        { where: { type: notificationContent.type }, transaction }
      )
    }

    const allCurrencies = await Currency.findAll()
    for (const currency of allCurrencies) {
      const name = await getTranslation('en', 'ru', currency.name.en)
      currency.name['ru'] = name

      await Currency.update({ name: currency.name }, { where: { id: currency.id }, transaction })
    }
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
    // Make sure you add your down seed/migration here and use the above created transaction if necessary

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
