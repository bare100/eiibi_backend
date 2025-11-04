import sequelize from 'sequelize'
import { Category } from '../../modules/categories/model.js'

const GROCERIES_CATEGORY = {
  name: {
    en: 'Groceries',
    ro: 'Produse alimentare',
    fr: 'Épicerie',
    de: 'Lebensmittel',
    it: 'Generi alimentari',
    es: 'Comestibles',
    ja: '食料品',
  },
  icon: 'groceries',
  subCategories: [
    {
      name: {
        en: 'Fruits and vegetables',
        ro: 'Fructe și legume',
        fr: 'Fruits et légumes',
        de: 'Obst und Gemüse',
        it: 'Frutta e verdura',
        es: 'Frutas y verduras',
        ja: '果物と野菜',
      },
    },
    {
      name: {
        en: 'Meat and fish',
        ro: 'Carne și pește',
        fr: 'Viande et poisson',
        de: 'Fleisch und Fisch',
        it: 'Carne e pesce',
        es: 'Carne y pescado',
        ja: '肉と魚',
      },
    },
    {
      name: {
        en: 'Dairy products',
        ro: 'Produse lactate',
        fr: 'Produits laitiers',
        de: 'Milchprodukte',
        it: 'Prodotti lattiero-caseari',
        es: 'Productos lácteos',
        ja: '乳製品',
      },
    },
    {
      name: {
        en: 'Bread and bakery',
        ro: 'Pâine și produse de panificație',
        fr: 'Pain et boulangerie',
        de: 'Brot und Backwaren',
        it: 'Pane e prodotti da forno',
        es: 'Pan y pastelería',
        ja: 'パンとベーカリー',
      },
    },
    {
      name: {
        en: 'Frozen',
        ro: 'Congelate',
        fr: 'Surgelés',
        de: 'Gefrorenes',
        it: 'Surgelati',
        es: 'Congelados',
        ja: '冷凍食品',
      },
    },
    {
      name: {
        en: 'Sweets and snacks',
        ro: 'Dulciuri și gustări',
        fr: 'Confiseries et snacks',
        de: 'Süßigkeiten und Snacks',
        it: 'Dolci e snack',
        es: 'Dulces y snacks',
        ja: 'お菓子とスナック',
      },
    },
    {
      name: {
        en: 'Alcohol',
        ro: 'Alcool',
        fr: 'Alcool',
        de: 'Alkohol',
        it: 'Alcol',
        es: 'Alcohol',
        ja: 'アルコール',
      },
    },
    {
      name: {
        en: 'Non-alcoholic',
        ro: 'Nealcoolice',
        fr: 'Non-alcoolisé',
        de: 'Alkoholfrei',
        it: 'Analcolico',
        es: 'Sin alcohol',
        ja: 'ノンアルコール',
      },
    },
    {
      name: {
        en: 'Cleaning products',
        ro: 'Produse de curățenie',
        fr: 'Produits de nettoyage',
        de: 'Reinigungsprodukte',
        it: 'Prodotti per la pulizia',
        es: 'Productos de limpieza',
        ja: '清掃用品',
      },
    },
    {
      name: {
        en: 'Pet products',
        ro: 'Produse pentru animale de companie',
        fr: 'Produits pour animaux',
        de: 'Haustierprodukte',
        it: 'Prodotti per animali',
        es: 'Productos para mascotas',
        ja: 'ペット用品',
      },
    },
    {
      name: {
        en: 'Presents',
        ro: 'Cadouri',
        fr: 'Cadeaux',
        de: 'Geschenke',
        it: 'Regali',
        es: 'Regalos',
        ja: '贈り物',
      },
    },
  ],
}

export async function up({
  context: queryInterface,
}: {
  context: sequelize.QueryInterface
}) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    const category = await Category.create(GROCERIES_CATEGORY, { transaction })

    for (const subCategory of GROCERIES_CATEGORY.subCategories) {
      await Category.create(
        { ...subCategory, parentCategoryId: category.id },
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

export async function down({
  context: queryInterface,
}: {
  context: sequelize.QueryInterface
}) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
