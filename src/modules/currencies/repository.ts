import { getDataFromCache, setDataInCache } from '../../api/middlewares/cache.js'
import { GenericRepository } from '../../lib/base-repository.js'
import { ExchangeRatesRepository } from '../exchange-rates/repository.js'
import { SettingsRepository } from '../settings/repository.js'
import { Currency, CURRENCIES_CACHE_KEY } from './model.js'

class CurrenciesRepository extends GenericRepository<Currency> {
  constructor() {
    super(Currency)
  }

  public async getAll() {
    const cachedCurrencies = await getDataFromCache(CURRENCIES_CACHE_KEY)
    if (cachedCurrencies) {
      return JSON.parse(cachedCurrencies)
    }

    const currencies = await Currency.findAll()
    setDataInCache(CURRENCIES_CACHE_KEY, JSON.stringify(currencies))
    return currencies
  }

  public async getUSDCurrency() {
    const allCurrencies = await this.getAll()
    return allCurrencies.find((currency) => currency.code.toLowerCase() === 'usd')
  }

  public async getPriceInCurrency(price: number, currencyId: string) {
    const allCurrencies = await this.getAll()
    const settings = await SettingsRepository.get()
    const currency = allCurrencies.find((currency) => currency.id === currencyId)
    if (!currency) {
      return 0
    }

    const mainCurrency = allCurrencies.find((currency) =>
      settings?.defaultCurrencyId
        ? currency.id === settings.defaultCurrencyId
        : currency.code === 'USD'
    )
    if (!mainCurrency) {
      throw new Error('Main currency not found')
    }

    const exchangeRate = await ExchangeRatesRepository.getLatest()
    if (!exchangeRate) {
      throw new Error('Exchange rate not found')
    }

    const fromRate = exchangeRate.rates[mainCurrency.code] ?? 1.0
    const toRate = exchangeRate.rates[currency.code] ?? 1.0

    return (price / fromRate) * toRate
  }

  public async getPriceInDollars(price: number, currencyId: string) {
    if (!currencyId) {
      return price
    }

    const allCurrencies = await this.getAll()
    const dollarCurrency = allCurrencies.find((currency) => currency.code === 'USD')
    if (!dollarCurrency) {
      console.error('Dollar currency not found')
      return price
    }

    if (dollarCurrency.id === currencyId) {
      return price
    }

    const currency = allCurrencies.find((currency) => currency.id === currencyId)
    if (!currency) {
      return 0
    }

    const exchangeRate = await ExchangeRatesRepository.getLatest()
    if (!exchangeRate) {
      console.error('Exchange rate not found')
      return price
    }

    const fromRate = exchangeRate.rates[currency.code] ?? 1.0
    const toRate = exchangeRate.rates[dollarCurrency.code] ?? 1.0

    return (price / fromRate) * toRate
  }
}

const currenciesRepositoryInstance = new CurrenciesRepository()
Object.freeze(currenciesRepositoryInstance)

export { currenciesRepositoryInstance as CurrenciesRepository }
