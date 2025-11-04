import { WebPaymentProduct } from '../../modules/web-payment-products/model.js'

export const createWebPaymentProductResource = () => {
  return {
    resource: WebPaymentProduct,
    options: {
      name: 'webPaymentProducts',
      navigation: {
        name: 'Financial',
        icon: 'CreditCard',
      },
      actions: {
        new: {
          isVisible: false,
          isAccessible: false,
        },
        bulkDelete: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
        },
        delete: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
        },
        edit: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
        },
      },
      listProperties: ['id', 'coinsNo', 'priceInUSD', 'createdAt'],
      showProperties: ['id', 'coinsNo', 'priceInUSD', 'createdAt'],
      filterProperties: ['id', 'coinsNo', 'priceInUSD', 'createdAt'],
      editProperties: ['coinsNo', 'priceInUSD'],
    },
  }
}
