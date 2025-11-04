import OpenAI from 'openai'
import { config } from '../config.js'
import { SettingsRepository } from '../modules/settings/repository.js'

export interface ImageAnalysisResult {
  category: string
  title: string
  suggestedPrice: {
    amount: number
    currency: string
  }
  description: string
}

class OpenAIService {
  private client: OpenAI

  async init() {
    const settings = await SettingsRepository.get()
    const token = settings.openAiApiKey || config.OPENAI.API_KEY
    if (!token) {
      console.error('No OpenAI API key found')
      return
    }

    this.client = new OpenAI({
      apiKey: token,
    })
  }

  async analyzeImages(
    imageUrls: string[],
    currency: string,
    categories: string[]
  ): Promise<ImageAnalysisResult> {
    const messages = [
      {
        role: 'system',
        name: 'system',
        content: `You are an expert in analyzing product images and categorizing them. 
          You must categorize items ONLY into these categories: ${categories.join(', ')}.
          You are also an expert in estimating market values in ${currency} currency and you give a fair to low price for the item.
          Provide accurate, market-relevant pricing based on the item's condition, brand, and features.`,
      },
      {
        role: 'user',
        name: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze these images and provide the following information in JSON format:
              - category: The most appropriate category for this item
              - title: A clear, concise title
              - suggestedPrice: An object containing amount (number) and currency ("${currency}")
              - description: A detailed description including condition, brand, features, and any notable details (max 500 characters)`,
          },
          ...imageUrls.map((url) => ({
            type: 'image_url',
            image_url: { url },
          })),
        ],
      },
    ]
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages as any,
        response_format: { type: 'json_object' },
        temperature: 0.5,
      })
      return this.parseResponse(response.choices[0].message.content || '', currency)
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw new Error(
        'Failed to analyze images. Please ensure all images are accessible and in a supported format.'
      )
    }
  }

  private parseResponse(content: string, currency: string): ImageAnalysisResult {
    try {
      const parsed = JSON.parse(content)

      // Validate and format the response
      const result: ImageAnalysisResult = {
        category: parsed.category ?? null,
        title: parsed.title ?? 'Untitled Item',
        suggestedPrice: {
          amount: Number(parsed.suggestedPrice?.amount ?? 0) || 0,
          currency: currency,
        },
        description: parsed.description ?? '',
      }

      if (result.suggestedPrice.amount < 0 || isNaN(result.suggestedPrice.amount)) {
        result.suggestedPrice.amount = 0
      }

      return result
    } catch (e) {
      console.error('Response parsing error:', e)
      throw new Error('Failed to parse OpenAI response')
    }
  }
}

const openaiService = new OpenAIService()
export { openaiService as OpenAIService }
