import { setDataInCache } from '../../api/middlewares/cache.js'
import { getDataFromCache } from '../../api/middlewares/cache.js'
import { GenericRepository } from '../../lib/base-repository.js'
import { WebPaymentProduct } from './model.js'

class WebPaymentProductsRepository extends GenericRepository<WebPaymentProduct> {
  constructor() {
    super(WebPaymentProduct)
  }

  public async getAll() {
    const cachedProducts = await getDataFromCache('web-payment-products')
    if (cachedProducts) {
      return JSON.parse(cachedProducts)
    }

    const products = await this.model.findAll()
    setDataInCache('web-payment-products', JSON.stringify(products))
    return products
  }

  public async getById(id: string): Promise<WebPaymentProduct | null> {
    return await this.model.findByPk(id)
  }
}

const webPaymentProductsRepoInstance = new WebPaymentProductsRepository()
Object.freeze(webPaymentProductsRepoInstance)

export { webPaymentProductsRepoInstance as WebPaymentProductsRepository }
