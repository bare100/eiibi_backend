import { UserMessage } from '../../modules/user-messages/model.js'

export const createUserMessageResource = () => {
  return {
    resource: UserMessage,
    options: {
      navigation: {
        name: 'User messages',
        icon: 'MessageCircle',
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
      listProperties: ['accountId', 'message', 'solved', 'createdAt'],
      showProperties: ['id', 'accountId', 'message', 'solved', 'createdAt'],
      filterProperties: ['id', 'accountId', 'message', 'solved', 'createdAt'],
      editProperties: ['solved'],
    },
  }
}
