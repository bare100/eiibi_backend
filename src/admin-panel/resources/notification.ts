import { FCMNotificationService } from '../../lib/notifications/index.js'
import { Notification } from '../../modules/notifications/model.js'
import { customComponents } from '../component-loader.js'

export const createNotificationResource = () => {
  return {
    resource: Notification,
    options: {
      navigation: {
        name: 'User data',
        icon: 'PieChart',
      },
      properties: {
        title: {
          components: {
            show: customComponents.JsonbField,
            edit: customComponents.EditTextarea,
            list: customComponents.JsonbFieldList,
          },
        },
        description: {
          components: {
            show: customComponents.JsonbField,
            edit: customComponents.EditTextarea,
          },
        },
      },
      listProperties: [
        'accountId',
        'type',
        'read',
        'readAt',
        'initiatedByAccountId',
        'title',
        'createdAt',
      ],
      filterProperties: [
        'id',
        'accountId',
        'initiatedByAccountId',
        'type',
        'entityId',
        'read',
        'readAt',
        'createdAt',
      ],
      showProperties: [
        'id',
        'accountId',
        'initiatedByAccountId',
        'type',
        'title',
        'description',
        'entityId',
        'read',
        'readAt',
        'createdAt',
      ],
      actions: {
        edit: {
          isVisible: false,
          isAccessible: false,
        },
        new: {
          isVisible: false,
          isAccessible: false,
        },
        bulkDelete: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
        },
        resendNotification: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
          actionType: 'record',
          component: false,
          handler: resendNotification,
          guard:
            'Only a push notification will be sent to the client, if possible. Are you sure you want to resend this notification?',
        },
        resendNotifications: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
          actionType: 'bulk',
          guard:
            'Only push notifications will be sent, if possible. Are you sure you want to resend the selected notifications?',
          handler: resedBulkNotifications,
          component: false,
        },
        delete: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
          actionType: 'record',
          handler: async (request, response, context) => {
            const { record } = context
            const notificationId = record.params.id
            await Notification.destroy({ where: { id: notificationId } })

            return {
              record: record.toJSON(context.currentAdmin),
              notice: {
                message: 'Notification was deleted successfully',
                type: 'success',
              },
              redirectUrl: '/admin/resources/notifications',
            }
          },
        },
      },
    },
  }
}

const resedBulkNotifications = async (request, response, context) => {
  const { records } = context
  const notificationIds = records.map((record) => record.id()) as string[]
  const recordsInJSON = records.map((record) => record.toJSON(context.currentAdmin))

  let sentNotifications = 0
  // Not sending in parallel, as it might be consuming for the DB and server
  for (const notificationId of notificationIds) {
    try {
      const sent = await FCMNotificationService.resendNotification(notificationId)
      if (sent) {
        sentNotifications += 1
      }
    } catch (error) {}
  }

  return {
    records: recordsInJSON,
    notice: {
      message:
        sentNotifications !== 0
          ? `${sentNotifications} notifications were sent`
          : 'No notifications were sent. It is either because the account/notification does not exist or the accounts have disabled push notifications.',
      type: sentNotifications !== 0 ? 'success' : 'error',
    },
    redirectUrl: '/admin/resources/notifications',
  }
}

const resendNotification = async (request, response, context) => {
  const { record } = context
  const notificationId = record.params.id

  try {
    const sent = await FCMNotificationService.resendNotification(notificationId)
    if (sent) {
      return {
        record: record.toJSON(context.currentAdmin),
        notice: {
          message: 'Push notification was resent',
          type: 'success',
        },
        redirectUrl: '/admin/resources/notifications',
      }
    }

    return {
      record: record.toJSON(context.currentAdmin),
      notice: {
        message:
          'Push notification could not be sent. Either the account does not exist or the push notifications are not available on its device.',
        type: 'error',
      },
      redirectUrl: '/admin/resources/notifications',
    }
  } catch (error) {
    return {
      record: record.toJSON(context.currentAdmin),
      notice: {
        message: `There was an error resending the notification: ${error.message}`,
        type: 'error',
      },
    }
  }
}
