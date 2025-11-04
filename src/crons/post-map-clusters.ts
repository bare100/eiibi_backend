// This cron job will run every hour and remove the post clusters that have expired.
import { schedule } from 'node-cron'
import { PostMapCluster } from '../modules/post-map-clusters/model.js'
import { Op } from 'sequelize'

export const runPostMapClustersCron = async () => {
  try {
    await removeExpiredPostMapClusters()
  } catch (error) {
    console.error('Error removing expired post map clusters', error)
  }

  schedule('0 * * * *', () => {
    console.log('Running posts map cron')
    removeExpiredPostMapClusters()
  })
}

const removeExpiredPostMapClusters = async () => {
  try {
    await PostMapCluster.destroy({
      where: {
        [Op.or]: {
          expiresAt: {
            [Op.lt]: new Date(),
          },
        },
      },
    })
  } catch (error) {
    console.error('Error removing expired post map clusters', error)
  }
}
