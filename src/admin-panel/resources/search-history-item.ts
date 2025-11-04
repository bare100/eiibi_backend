import { SearchHistoryItem } from '../../modules/search-history/model.js'
import { customComponents } from '../component-loader.js'

export const createSearchHistoryItemResource = () => {
  return {
    resource: SearchHistoryItem,
    options: {
      navigation: {
        name: 'User data',
        icon: 'User',
      },
      actions: {
        new: {
          isVisible: false,
          isAccessible: false,
        },
        edit: {
          isVisible: false,
          isAccessible: false,
        },
        bulkDelete: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
        },
        delete: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
        },
      },
      properties: {
        data: {
          components: {
            show: customComponents.JsonbField,
          },
        },
      },
      showProperties: [
        'id',
        'accountId',
        'searchKey',
        'type',
        'entityId',
        'data',
        'createdAt',
        'updatedAt',
      ],
      listProperties: [
        'accountId',
        'searchKey',
        'type',
        'entityId',
        'createdAt',
      ],
      filterProperties: [
        'id',
        'accountId',
        'searchKey',
        'type',
        'entityId',
        'createdAt',
        'updatedAt',
      ],
    },
  }
}
