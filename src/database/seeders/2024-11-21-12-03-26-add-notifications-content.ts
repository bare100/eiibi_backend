import sequelize from 'sequelize'
import { NotificationTypes } from '../../lib/notifications/types.js'
import { NotificationContent } from '../../modules/auxiliary-models/notification-content.js'

const NOTIFICATIONS = {
  [NotificationTypes.POST_ADDED_TO_FAVOURITES]: {
    title: {
      en: 'Post added to favourites',
      ro: 'Postare adăugată la favorite',
      fr: 'Publication ajoutée aux favoris',
      de: 'Beitrag zu Favoriten hinzugefügt',
      it: 'Post aggiunto ai preferiti',
      es: 'Publicación añadida a favoritos',
      ja: '投稿がお気に入りに追加されました',
    },
    description: {
      en: `{{userName}} added your post to favourites`,
      ro: '{{userName}} a adăugat postarea ta la favorite',
      fr: '{{userName}} a ajouté votre publication à ses favoris',
      de: '{{userName}} hat deinen Beitrag zu den Favoriten hinzugefügt',
      it: '{{userName}} ha aggiunto il tuo post ai preferiti',
      es: '{{userName}} añadió tu publicación a sus favoritos',
      ja: '{{userName}} があなたの投稿をお気に入りに追加しました',
    },
  },
  [NotificationTypes.NEW_POST_FROM_FOLLOWING]: {
    title: {
      en: 'New post from someone you follow',
      ro: 'Postare nouă de la cineva pe care îl urmărești',
      fr: "Nouvelle publication d'une personne que vous suivez",
      de: 'Neuer Beitrag von jemandem, dem du folgst',
      it: 'Nuovo post da qualcuno che segui',
      es: 'Nueva publicación de alguien a quien sigues',
      ja: 'フォローしている人からの新しい投稿',
    },
    description: {
      en: `{{postCreatorName}} created a new post!`,
      fr: '{{postCreatorName}} a créé une nouvelle publication!',
      de: '{{postCreatorName}} hat einen neuen Beitrag erstellt!',
      it: '{{postCreatorName}} ha creato un nuovo post!',
      es: '¡{{postCreatorName}} creó una nueva publicación!',
      ja: '{{postCreatorName}} が新しい投稿を作成しました！',
    },
  },
  [NotificationTypes.FAVOURITE_POST_PRICE_CHANGE]: {
    title: {
      en: '👀 Favourite post price change',
      ro: '👀 Modificare a prețului postării favorite',
      fr: '👀 Changement de prix pour une publication favorite',
      de: '👀 Preisänderung bei favorisiertem Beitrag',
      it: '👀 Cambio di prezzo del post preferito',
      es: '👀 Cambio de precio en la publicación favorita',
      ja: '👀 お気に入りの投稿の価格変更',
    },
    description: {
      en: `One of your favourite post price has been changed from {{oldPrice}} to {{newPrice}}`,
      ro: 'Prețul uneia dintre postările tale favorite a fost schimbat de la {{oldPrice}} la {{newPrice}}',
      fr: "Le prix de l'une de vos publications favorites a été modifié de {{oldPrice}} à {{newPrice}}",
      de: 'Der Preis eines deiner favorisierten Beiträge wurde von {{oldPrice}} auf {{newPrice}} geändert',
      it: 'Il prezzo di uno dei tuoi post preferiti è stato modificato da {{oldPrice}} a {{newPrice}}',
      es: 'El precio de una de tus publicaciones favoritas ha cambiado de {{oldPrice}} a {{newPrice}}',
      ja: 'お気に入りの投稿の価格が {{oldPrice}} から {{newPrice}} に変更されました',
    },
  },
  [NotificationTypes.NEW_FOLLOWER]: {
    title: {
      en: 'New follower',
      ro: 'Urmăritor nou',
      fr: 'Nouveau suiveur',
      de: 'Neuer Follower',
      it: 'Nuovo follower',
      es: 'Nuevo seguidor',
      ja: '新しいフォロワー',
    },
    description: {
      en: `{{followerName}} started following you`,
      ro: `{{followerName}} a fost adăugat la urmăritorii tăi`,
      fr: `{{followerName}} a commencé à vous suivre`,
      de: `{{followerName}} hat angefangen, Ihnen zu folgen`,
      it: `{{followerName}} ha iniziato a seguirti`,
      es: `{{followerName}} ha comenzado a seguirte`,
      ja: `{{followerName}} さんがあなたをフォローし始めました`,
    },
  },
  [NotificationTypes.NEW_MESSAGE]: {
    title: {
      en: '💬 New message',
      ro: '💬 Mesaj nou',
      fr: '💬 Nouveau message',
      de: '💬 Neue Nachricht',
      it: '💬 Nuovo messaggio',
      es: '💬 Nuevo mensaje',
      ja: '💬 新しいメッセージ',
    },
    description: {
      en: 'You have a new message from someone',
      ro: 'Ai un mesaj nou de la cineva',
      fr: "Vous avez un nouveau message de quelqu'un",
      de: 'Sie haben eine neue Nachricht von jemandem',
      it: 'Hai un nuovo messaggio da qualcuno',
      es: 'Tienes un nuevo mensaje de alguien',
      ja: '誰かから新しいメッセージがあります',
    },
  },
}

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    for (const [type, { title, description }] of Object.entries(NOTIFICATIONS)) {
      await NotificationContent.create(
        {
          type,
          title,
          description,
        },
        { transaction }
      )
    }

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
