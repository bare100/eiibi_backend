import { Payment } from '../../modules/payments/model.js'

export const createPaymentResource = () => {
  return {
    resource: Payment,
    options: {
      navigation: {
        name: 'Financial',
        icon: 'PieChart',
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
      listProperties: [
        'number',
        'accountId',
        'vatRate',
        'currency',
        'amount',
        'vatAmount',
        'totalAmount',
        'boughtPackage',
        'store',
        'paidInCurrencyId',
      ],
      showProperties: [
        'id',
        'number',
        'accountId',
        'email',
        'name',
        'vatRate',
        'currency',
        'amount',
        'vatAmount',
        'totalAmount',
        'boughtPackage',
        'transactionId',
        'store',
        'paidInCurrencyId',
        'purchasedAt',
        'createdAt',
      ],
      filterProperties: [
        'id',
        'number',
        'accountId',
        'vatRate',
        'currency',
        'amount',
        'vatAmount',
        'totalAmount',
        'boughtPackage',
        'transactionId',
        'store',
        'purchasedAt',
        'createdAt',
      ],
      editProperties: [
        'vatRate',
        'currency',
        'amount',
        'vatAmount',
        'totalAmount',
        'boughtPackage',
        'transactionId',
        'paidInCurrencyId',
        'store',
      ],
    },
  }
}
