import { Attributes, FindOptions, Op } from 'sequelize'
import { Asset } from '../../modules/assets/model.js'
import { PostAsset } from '../../modules/auxiliary-models/post-assets.js'
import { Post } from '../../modules/posts/model.js'
import { Account } from '../../modules/accounts/model.js'
import { Payment } from '../../modules/payments/model.js'
import sequelize from 'sequelize'
import dayjs from 'dayjs'

export const loadAssetsForPosts = async (postIds: string[]) => {
  postIds = [].concat(postIds)
  const postWithAssets = await PostAsset.findAll({
    where: { postId: { [Op.in]: postIds } },
    include: { model: Asset, as: 'asset' },
  })

  return postWithAssets.map((el) => {
    return { postId: el.postId, asset: el.asset.toJSON() }
  })
}

export const loadDashboardData = async () => {
  const [postsCount, accountsCount, paymentsCount] = await Promise.all([
    Post.count(),
    Account.count(),
    Payment.count(),
  ])

  const startOfYear = dayjs().startOf('year').toDate()
  const endOfYear = dayjs().endOf('year').toDate()

  const QUERY_PER_MONTH = {
    attributes: [
      [sequelize.fn('date_trunc', 'month', sequelize.col('createdAt')), 'month'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    where: {
      createdAt: {
        [Op.between]: [startOfYear, endOfYear],
      },
    },
    group: [sequelize.fn('date_trunc', 'month', sequelize.col('createdAt'))],
    order: [[sequelize.fn('date_trunc', 'month', sequelize.col('createdAt')), 'ASC']],
  }

  const [postsPerMonth, accountsPerMonth, paymentsPerMonth] = await Promise.all([
    Post.findAll(QUERY_PER_MONTH as unknown as FindOptions<Attributes<Post>>),
    Account.findAll(QUERY_PER_MONTH as unknown as FindOptions<Attributes<Account>>),
    Payment.findAll(QUERY_PER_MONTH as unknown as FindOptions<Attributes<Payment>>),
  ])

  const postsPerMonthFormatted = postsPerMonth.map((el) => {
    return {
      count: el.get('count'),
      month: dayjs(el.get('month') as string).format('MMMM'),
    }
  })

  const accountsPerMonthFormatted = accountsPerMonth.map((el) => {
    return {
      count: el.get('count'),
      month: dayjs(el.get('month') as string).format('MMMM'),
    }
  })

  const paymentsPerMonthFormatted = paymentsPerMonth.map((el) => {
    return {
      count: el.get('count'),
      month: dayjs(el.get('month') as string).format('MMMM'),
    }
  })

  return {
    postsCount,
    accountsCount,
    paymentsCount,
    accountsPerMonth: accountsPerMonthFormatted,
    paymentsPerMonth: paymentsPerMonthFormatted,
    postsPerMonth: postsPerMonthFormatted,
  }
}
