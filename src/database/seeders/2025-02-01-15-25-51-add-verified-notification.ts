import sequelize from 'sequelize'
import { NotificationContent } from '../../modules/auxiliary-models/notification-content.js'
import { NotificationTypes } from '../../lib/notifications/types.js'

const VERIFIED_NOTIFICATION = {
  title: {
    en: 'Your account has been verified',
    ro: 'Contul tău a fost verificat',
    fr: 'Votre compte a été vérifié',
    de: 'Ihr Konto wurde verifiziert',
    it: 'Il tuo account è stato verificato',
    es: 'Tu cuenta ha sido verificada',
    ja: 'アカウントが確認されました',
  },
  description: {
    en: 'Your account has been verified. The verified badge is now visible on your avatar.',
    ro: 'Contul tău a fost verificat. Insigna de verificare este acum vizibilă pe avatarul tău.',
    fr: 'Votre compte a été vérifié. Le badge vérifié est maintenant visible sur votre avatar.',
    de: 'Ihr Konto wurde verifiziert. Das verifizierte Abzeichen ist jetzt auf Ihrem Avatar sichtbar.',
    it: 'Il tuo account è stato verificato. Il badge verificato è ora visibile sul tuo avatar.',
    es: 'Tu cuenta ha sido verificada. La insignia verificada ahora es visible en tu avatar.',
    ja: 'アカウントが確認されました。確認されたバッジが今あなたのアバターに表示されます。',
  },
}

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await NotificationContent.create(
      {
        type: NotificationTypes.ACCOUNT_VERIFIED,
        title: VERIFIED_NOTIFICATION.title,
        description: VERIFIED_NOTIFICATION.description,
        enabled: true,
      },
      { transaction }
    )
    await transaction.commit()
  } catch (error) {
    console.error(error)
    await transaction.rollback()
    throw error
  }
}

export async function down({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
