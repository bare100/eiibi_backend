import { DatabaseConnection } from '../../database/index.js'
import { FCMNotificationService } from '../../lib/notifications/index.js'
import { Account } from '../../modules/accounts/model.js'
import { AccountsRepository } from '../../modules/accounts/repository.js'
import { customComponents } from '../component-loader.js'
import { roleBasedAccessControl } from '../hooks/role-based-access-control.js'

export const createAccountResource = () => {
  return {
    resource: Account,
    features: [roleBasedAccessControl],
    options: {
      properties: {
        acceptedTermsAndCondition: {
          label: 'Accepted T&C',
        },
        picture: {
          components: {
            show: customComponents.AccountAvatar,
            list: customComponents.AccountAvatar,
            edit: customComponents.AccountAvatar,
          },
        },
        allowedNotifications: {
          components: {
            show: customComponents.JsonbField,
            edit: customComponents.TranslatedValue,
          },
        },
        identities: {
          components: {
            show: customComponents.JsonbField,
          },
        },
        meta: {
          components: {
            show: customComponents.JsonbField,
            edit: customComponents.TranslatedValue,
          },
        },
        selectedCurrencyId: {
          components: {
            show: customComponents.JsonbField,
            list: customComponents.JsonbFieldList,
            edit: customComponents.SimpleInput,
          },
        },
        authId: {
          custom: {
            role: 'admin',
            defaultValue: 'a secret',
          },
        },
        phone: {
          custom: {
            role: 'admin',
            defaultValue: 'a secret',
          },
        },
        rawEmail: {
          custom: {
            role: 'admin',
            defaultValue: 'a secret',
          },
        },
        deviceFCMToken: {
          custom: {
            role: 'admin',
            defaultValue: 'a secret',
          },
        },
      },
      navigation: {
        name: 'General',
        icon: 'Home',
      },
      listProperties: [
        'picture',
        'rawEmail',
        'isAnonymous',
        'acceptedTermsAndCondition',
        'categoriesSetupDone',
        'introDone',
        'introSkipped',
        'coins',
        'verified',
        'verificationRequestedAt',
        'createdAt',
      ],
      showProperties: [
        'picture',
        'id',
        'rawEmail',
        'authId',
        'isAnonymous',
        'categoriesSetupDone',
        'introDone',
        'introSkipped',
        'acceptedTermsAndCondition',
        'assetId',
        'deviceFCMToken',
        'phone',
        'identities',
        'allowedNotifications',
        'verified',
        'verificationRequestedAt',
        'meta',
        'coins',
        'selectedCurrencyId',
        'createdAt',
        'updatedAt',
      ],
      editProperties: [
        'coins',
        'categoriesSetupDone',
        'introDone',
        'introSkipped',
        'acceptedTermsAndCondition',
        'assetId',
        'allowedNotifications',
        'verified',
        'meta',
        'selectedCurrencyId',
      ],
      filterProperties: [
        'id',
        'email',
        'isAnonymous',
        'acceptedTermsAndCondition',
        'categoriesSetupDone',
        'introDone',
        'introSkipped',
        'coins',
        'verified',
        'verificationRequestedAt',
        'assetId',
        'createdAt',
      ],
      actions: {
        new: {
          isVisible: false,
          isAccessible: false,
        },
        edit: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
          before: async (request, context) => {
            if (request.method === 'post') {
              delete request.payload.email
              delete request.payload.rawEmail
            }
            return request
          },
        },
        delete: {
          handler: deleteAccount,
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
          guard: 'All the data related to this account will be removed!',
        },
        verify: {
          handler: verifyAccount,
          actionType: 'record',
          component: false,
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
          guard: 'Are you sure you want to verify this account?',
        },
        bulkDelete: {
          actionType: 'bulk',
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
          handler: deleteAccountsBulk,
        },
        sendNotification: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
          actionType: 'bulk',
          component: customComponents.SendAccountNotificationModal,
          handler: sendNotificationToUsers,
        },
        verifyAccounts: {
          isAccessible: ({ currentAdmin }) => currentAdmin.role === 'admin',
          actionType: 'bulk',
          component: false,
          handler: verifyAccountsBulk,
          guard: 'Are you sure you want to verify the selected accounts?',
        },
      },
    },
  }
}

const sendNotificationToUsers = async (request, response, context) => {
  const { records } = context
  const accountIds = records.map((record) => record.id()) as string[]
  const recordsInJSON = records.map((record) => record.toJSON(context.currentAdmin))

  if (request.method !== 'post') {
    return {
      records: recordsInJSON,
    }
  }

  try {
    const { title, description } = request.payload

    const sentNotifications = await FCMNotificationService.sendSystemNotification(
      accountIds,
      title,
      description
    )

    if (!sentNotifications) {
      return {
        records: recordsInJSON,
        notice: {
          message: `0 notifications were sent. The accounts need to have push notifications enabled from the app.`,
          type: 'warning',
        },
      }
    }

    return {
      records: recordsInJSON,
      notice: {
        message: `${sentNotifications} notifications were sent.`,
        type: 'success',
      },
    }
  } catch (error) {
    return {
      records: recordsInJSON,
      notice: {
        message: `There was a problem while trying to send the notification: ${error.message}`,
        type: 'error',
      },
    }
  }
}

const verifyAccountsBulk = async (request, response, context) => {
  const { records } = context
  const accountIds = records.map((record) => record.id()) as string[]
  const recordsInJSON = records.map((record) => record.toJSON(context.currentAdmin))

  const transaction = await DatabaseConnection.getInstance().transaction()

  try {
    for (const accountId of accountIds) {
      await Account.update(
        { verified: true, verifiedAt: new Date() },
        {
          where: {
            id: accountId,
          },
          transaction,
        }
      )

      FCMNotificationService.sendAccountWasVerifiedNotification(accountId)
    }

    await transaction.commit()

    return {
      records: recordsInJSON,
      notice: {
        message: 'Accounts were verified successfully',
        type: 'success',
      },
      redirectUrl: '/admin/resources/accounts',
    }
  } catch (error) {
    try {
      await transaction.rollback()
    } catch (err) {
      console.error('Could not rollback transaction', err)
    }

    return {
      records: recordsInJSON,
      notice: {
        message: `There was an error deleting the records: ${error.message}`,
        type: 'error',
      },
    }
  }
}

const deleteAccountsBulk = async (request, response, context) => {
  const { records } = context
  const accountIds = records.map((record) => record.id()) as string[]
  const recordsInJSON = records.map((record) => record.toJSON(context.currentAdmin))

  if (request.method !== 'post') {
    return {
      records: recordsInJSON,
    }
  }

  const transaction = await DatabaseConnection.getInstance().transaction()

  try {
    for (const accountId of accountIds) {
      await AccountsRepository.deleteAccountData(accountId, transaction, false)
    }

    await transaction.commit()

    return {
      records: recordsInJSON,
      notice: {
        message: 'Accounts were deleted successfully',
        type: 'success',
      },
      redirectUrl: '/admin/resources/accounts',
    }
  } catch (error) {
    try {
      await transaction.rollback()
    } catch (err) {
      console.error('Could not rollback transaction', err)
    }

    return {
      records: recordsInJSON,
      notice: {
        message: `There was an error deleting the records: ${error.message}`,
        type: 'error',
      },
    }
  }
}

const verifyAccount = async (request, response, context) => {
  const { record } = context
  const accountId = record.params.id

  try {
    await Account.update(
      { verified: true, verifiedAt: new Date() },
      {
        where: {
          id: accountId,
        },
      }
    )

    FCMNotificationService.sendAccountWasVerifiedNotification(accountId)

    return {
      record: record.toJSON(context.currentAdmin),
      notice: {
        message: 'Account was verified successfully',
        type: 'success',
      },
      redirectUrl: '/admin/resources/accounts',
    }
  } catch (error) {
    return {
      record: record.toJSON(context.currentAdmin),
      notice: {
        message: `There was an error verifying the account: ${error.message}`,
        type: 'error',
      },
    }
  }
}

const deleteAccount = async (request, response, context) => {
  const { record } = context
  const accountId = record.params.id

  try {
    await AccountsRepository.deleteAccountData(accountId)

    return {
      record: record.toJSON(context.currentAdmin),
      notice: {
        message: 'Account was deleted successfully',
        type: 'success',
      },
      redirectUrl: '/admin/resources/accounts',
    }
  } catch (error) {
    return {
      record: record.toJSON(context.currentAdmin),
      notice: {
        message: `There was an error deleting the record: ${error.message}`,
        type: 'error',
      },
    }
  }
}
