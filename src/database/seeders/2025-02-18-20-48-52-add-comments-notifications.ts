import sequelize from 'sequelize'
import { NotificationContent } from '../../modules/auxiliary-models/notification-content.js'
import { NotificationTypes } from '../../lib/notifications/types.js'

const NEW_REPLY_COMMENT_NOTIFICATION = {
  title: {
    en: 'New reply to your comment',
    ro: 'Răspuns nou la comentariul tău',
    fr: 'Nouvelle réponse à votre commentaire',
    de: 'Neue Antwort auf Ihren Kommentar',
    it: 'Nuova risposta al tuo commento',
    es: 'Nueva respuesta a tu comentario',
    ja: 'あなたのコメントへの新しい返信',
  },
  description: {
    en: '{{userName}} added a new reply to your comment.',
    ro: '{{userName}} a adăugat un răspuns nou la comentariul tău.',
    fr: '{{userName}} a ajouté une nouvelle réponse à votre commentaire.',
    de: '{{userName}} hat eine neue Antwort auf Ihren Kommentar hinzugefügt.',
    it: '{{userName}} ha aggiunto una nuova risposta al tuo commento.',
    es: '{{userName}} agregó una nueva respuesta a tu comentario.',
    ja: '{{userName}} があなたのコメントに新しい返信を追加しました。',
  },
}

const NEW_COMMENT_NOTIFICATION = {
  title: {
    en: 'New comment on your post',
    ro: 'Comentariu nou la postarea ta',
    fr: 'Nouveau commentaire sur votre post',
    de: 'Neuer Kommentar zu Ihrer Auktion',
    it: 'Nuovo commento sulla tua posta',
    es: 'Nuevo comentario en tu post',
    ja: 'あなたの投稿に新しいコメント',
  },
  description: {
    en: '{{userName}} added a new comment to your post.',
    ro: '{{userName}} a adăugat un comentariu nou la postarea ta.',
    fr: '{{userName}} a ajouté un nouveau commentaire à votre post.',
    de: '{{userName}} hat einen neuen Kommentar zu Ihrer Auktion hinzugefügt.',
    it: '{{userName}} ha aggiunto un nuovo commento alla tua posta.',
    es: '{{userName}} agregó un nuevo comentario a tu post.',
    ja: '{{userName}} があなたの投稿に新しいコメントを追加しました。',
  },
}

const COMMENT_ON_SAME_POST_NOTIFICATION = {
  title: {
    en: 'New comment on post you commented',
    ro: 'Comentariu nou la postarea la care ai comentat',
    fr: 'Nouveau commentaire sur le post que vous avez commenté',
    de: 'Neuer Kommentar zum Beitrag, den Sie kommentiert haben',
    it: 'Nuovo commento al post che hai commentato',
    es: 'Nuevo comentario en el post que comentaste',
    ja: 'あなたがコメントした投稿への新しいコメント',
  },
  description: {
    en: '{{userName}} added a new comment to a post you commented as well.',
    ro: '{{userName}} a adăugat un comentariu nou la un post la care ai comentat și tu.',
    fr: '{{userName}} a ajouté un nouveau commentaire à un post que vous avez également commenté.',
    de: '{{userName}} hat einen neuen Kommentar zu einem Beitrag hinzugefügt, den Sie ebenfalls kommentiert haben.',
    it: '{{userName}} ha aggiunto un nuovo commento a un post che hai commentato anche tu.',
    es: '{{userName}} agregó un nuevo comentario a un post que también comentaste.',
    ja: '{{userName}} があなたもコメントした投稿に新しいコメントを追加しました。',
  },
}

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await NotificationContent.create(
      {
        type: NotificationTypes.NEW_COMMENT_ON_POST,
        title: NEW_COMMENT_NOTIFICATION.title,
        description: NEW_COMMENT_NOTIFICATION.description,
        enabled: true,
      },
      { transaction }
    )

    await NotificationContent.create(
      {
        type: NotificationTypes.REPLY_ON_POST_COMMENT,
        title: NEW_REPLY_COMMENT_NOTIFICATION.title,
        description: NEW_REPLY_COMMENT_NOTIFICATION.description,
        enabled: true,
      },
      { transaction }
    )

    await NotificationContent.create(
      {
        type: NotificationTypes.COMMENT_ON_SAME_POST,
        title: COMMENT_ON_SAME_POST_NOTIFICATION.title,
        description: COMMENT_ON_SAME_POST_NOTIFICATION.description,
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
    // Make sure you add your down seed/migration here and use the above created transaction if necessary

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
