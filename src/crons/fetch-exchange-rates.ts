// This cron will run every hour, checking if the last exchange rate is older than
// 12 hours. If it is, it will try to fetch the exchange rates from two URL:
// - https://open.er-api.com/v6/latest
// - https://api.frankfurter.app/latest?base=usd
// If the first URL does not return any data, it will try the second one.
// If both URLs do not return any data, it will not update the exchange rate.

import { schedule } from 'node-cron'
import { ExchangeRatesRepository } from '../modules/exchange-rates/repository.js'
import { ExchangeRate } from '../modules/exchange-rates/model.js'
import { CurrenciesRepository } from '../modules/currencies/repository.js'
import { WebSocketInstance } from '../ws/instance.js'
import { WebsocketEvents } from '../ws/socket-module.js'
import { deleteDataFromCache } from '../api/middlewares/cache.js'
import { EXCHANGE_RATES_CACHE_KEY } from '../modules/exchange-rates/controller.js'

export const runFetchExchangeRatesCron = () => {
  console.log('Running fetch exchange rates cron')
  // wait for 5 seconds before running the cron
  setTimeout(() => {
    fetchExchangeRates()
  }, 5000)

  schedule('0 * * * *', () => {
    console.log('Running fetch exchange rates cron')
    fetchExchangeRates()
  })
}

const fetchExchangeRates = async () => {
  const [lastExchangeRate, count] = await Promise.all([
    ExchangeRatesRepository.getLatest(),
    ExchangeRatesRepository.count(),
  ])

  if (lastExchangeRate) {
    const lastExchangeRateDate = new Date(lastExchangeRate.ratesDate)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - lastExchangeRateDate.getTime())
    const diffHours = Math.round(diffTime / (1000 * 60 * 60))
    if (diffHours < 12) {
      return
    }

    // If we added an exchange rate in the last 12 hours, we should not fetch a new one
    const lastAddedDate = new Date(lastExchangeRate.createdAt)
    const addedDiffTime = Math.abs(now.getTime() - lastAddedDate.getTime())
    const addedDiffHours = Math.round(addedDiffTime / (1000 * 60 * 60))
    if (addedDiffHours < 12 && count > 1) {
      console.log('Last exchange rate was added in the last 12 hours, skipping')
      return
    }
  }

  try {
    let exchangeRate = await fetchOpenExchangeRates()
    if (!exchangeRate) {
      exchangeRate = await fetchFrankfurterExchangeRates()
    }

    if (!exchangeRate) {
      throw new Error('No exchange rate found')
    }

    // If the date difference between the last exchange rate and the current exchangeRate is not more than 12 hours, we should not update the exchange rate
    if (
      exchangeRate.ratesDate.getFullYear() === lastExchangeRate?.ratesDate.getFullYear() &&
      exchangeRate.ratesDate.getMonth() === lastExchangeRate?.ratesDate.getMonth() &&
      exchangeRate.ratesDate.getDate() === lastExchangeRate?.ratesDate.getDate()
    ) {
      console.log('Exchange rate is from the same day as the last one, skipping')
      return
    }

    await exchangeRate.save()

    deleteDataFromCache(EXCHANGE_RATES_CACHE_KEY)
    const socketInstance = WebSocketInstance.getInstance()
    socketInstance.sendEventToAllAccounts(WebsocketEvents.NEW_EXCHANGE_RATE, {
      ...exchangeRate.toJSON(),
    })
  } catch (error) {
    console.error('Error fetching exchange rates', error)
  }
}

const fetchOpenExchangeRates = async () => {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest')
    const data = (await response.json()) as {
      result: string
      data: string
      time_last_update_utc: string
      base_code: string
      rates: Record<string, number>
    }
    if (data.result !== 'success') {
      throw new Error(`Open exchange rates result is not success: ${data}`)
    }

    if (data.base_code !== 'USD') {
      throw new Error(`Open exchange rates base code is not USD: ${data}`)
    }

    const currencies = await CurrenciesRepository.getAll()
    const usdCurrency = currencies.find((currency) => currency.code === 'USD')
    if (!usdCurrency) {
      throw new Error('USD currency not found')
    }

    const exchangeRate = new ExchangeRate({
      ratesDate: new Date(data.time_last_update_utc),
      rates: data.rates,
      baseCurrencyId: usdCurrency.id,
    })

    return exchangeRate
  } catch (error) {
    console.error('Error fetching open exchange rates', error)
    return null
  }
}

const fetchFrankfurterExchangeRates = async () => {
  try {
    const response = await fetch('https://api.frankfurter.app/latest?base=usd')
    const data = (await response.json()) as {
      base: string
      date: string
      rates: Record<string, number>
    }

    if (data.base !== 'USD') {
      throw new Error(`Frankfurter exchange rates base code is not USD: ${data}`)
    }

    const currencies = await CurrenciesRepository.getAll()
    const usdCurrency = currencies.find((currency) => currency.code === 'USD')
    if (!usdCurrency) {
      throw new Error('USD currency not found')
    }

    const exchangeRate = new ExchangeRate({
      ratesDate: new Date(data.date),
      rates: data.rates,
      baseCurrencyId: usdCurrency.id,
    })

    return exchangeRate
  } catch (error) {
    console.error('Error fetching frankfurter exchange rates', error)
    return null
  }
}
