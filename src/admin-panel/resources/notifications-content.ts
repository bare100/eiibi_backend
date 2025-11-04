import { NotificationContent } from '../../modules/auxiliary-models/notification-content.js'
import { customComponents } from '../component-loader.js'

export const createNotificationsContentResource = () => {
  return {
    resource: NotificationContent,
    options: {
      navigation: {
        name: 'Settings',
        icon: 'Settings',
      },
      properties: {
        title: {
          components: {
            show: customComponents.JsonbField,
            list: customComponents.JsonbFieldList,
            edit: customComponents.TranslatedValue,
          },
        },
        description: {
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
      listProperties: ['type', 'title', 'description', 'enabled'],
      showProperties: ['type', 'title', 'description', 'enabled'],
      editProperties: ['title', 'description', 'enabled'],
    },
  }
}
