import { GenericRepository } from '../../lib/base-repository.js'
import { ExchangeRate } from './model.js'

class ExchangeRatesRepository extends GenericRepository<ExchangeRate> {
  constructor() {
    super(ExchangeRate)
  }

  public async getLatest() {
    return ExchangeRate.findOne({
      order: [['ratesDate', 'DESC']],
    })
  }

  public async count() {
    return ExchangeRate.count()
  }
}

const exchangeRatesRepositoryInstance = new ExchangeRatesRepository()
Object.freeze(exchangeRatesRepositoryInstance)

export { exchangeRatesRepositoryInstance as ExchangeRatesRepository }
