import { Currency } from '../../modules/currencies/model.js'
import { customComponents } from '../component-loader.js'

export const createCurrenciesResource = () => {
  return {
    resource: Currency,
    options: {
      navigation: {
        name: 'Exchange Rates',
        icon: 'Settings',
      },
      properties: {
        name: {
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
          isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin',
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
      listProperties: ['id', 'code', 'symbol', 'name'],
      showProperties: ['id', 'code', 'symbol', 'name'],
      editProperties: ['code', 'symbol', 'name'],
    },
  }
}
