import { FilterItem } from '../../modules/filters/model.js'
import { customComponents } from '../component-loader.js'

export const createFilterItemResource = () => {
  return {
    resource: FilterItem,
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
        delete: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
        },
        bulkDelete: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
        },
      },
      properties: {
        data: {
          components: {
            list: customComponents.JsonbFieldList,
            show: customComponents.JsonbField,
          },
        },
      },
      showProperties: [
        'id',
        'accountId',
        'name',
        'type',
        'data',
        'createdAt',
        'updatedAt',
      ],
      listProperties: ['accountId', 'name', 'type', 'createdAt'],
      filterProperties: [
        'id',
        'accountId',
        'name',
        'type',
        'createdAt',
        'updatedAt',
      ],
    },
  }
}
