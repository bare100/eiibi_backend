import Translator, { LanguageCode } from 'open-google-translator'
import NodeCache from 'node-cache'

class TranslationManager {
  // The key of this object is the destination language
  // The value is another object (NodeCache) with the key being the initial text to translate
  // and the value being the translated text
  private translationsCache: Record<string, NodeCache> = {}

  async translate(text: string, to: string) {
    if (!text || !text.length) {
      return text
    }

    if (this.translationsCache[to]) {
      const cachedTranslation = this.translationsCache[to].get(text)
      if (cachedTranslation) {
        return cachedTranslation
      }
    }

    const translations = await Translator.TranslateLanguageData({
      listOfWordsToTranslate: [text],
      fromLanguage: 'auto' as LanguageCode,
      toLanguage: to as LanguageCode,
    })

    let translatedText = translations[0].translation
    if (Array.isArray(translatedText)) {
      translatedText = translatedText[0]
    }

    if (!this.translationsCache[to]) {
      const twoHoursInSeconds = 2 * 60 * 60
      this.translationsCache[to] = new NodeCache({ stdTTL: twoHoursInSeconds })
    }

    this.translationsCache[to].set(text, translatedText)
    return translatedText
  }
}

const translationManager = new TranslationManager()
export { translationManager as TranslationManager }
