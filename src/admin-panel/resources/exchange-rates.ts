import { ExchangeRate } from '../../modules/exchange-rates/model.js'
import { customComponents } from '../component-loader.js'

export const createExchangeRatesResource = () => {
  return {
    resource: ExchangeRate,
    options: {
      navigation: {
        name: 'Exchange Rates',
        icon: 'Money',
      },
      properties: {
        baseCurrencyId: {
          components: {
            show: customComponents.JsonbField,
            list: customComponents.JsonbFieldList,
            edit: customComponents.SimpleInput,
          },
        },
        rates: {
          components: {
            show: customComponents.JsonbField,
            list: customComponents.JsonbFieldList,
            edit: customComponents.TranslatedValue,
          },
        },
      },
      actions: {
        new: {
          isVisible: false,
          isAccessible: false,
        },
        edit: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
        },
        bulkDelete: {
          isAccessible: false,
        },
        filter: {
          isVisible: false,
          isAccessible: false,
        },
        delete: {
          isVisible: false,
          isAccessible: false,
        },
      },
      listProperties: ['id', 'ratesDate', 'rates'],
      showProperties: ['id', 'baseCurrencyId', 'ratesDate', 'rates'],
      editProperties: ['baseCurrencyId', 'ratesDate', 'rates'],
    },
  }
}
