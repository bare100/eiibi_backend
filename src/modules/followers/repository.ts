import { GenericRepository } from '../../lib/base-repository.js'
import { Account } from '../accounts/model.js'
import { Asset } from '../assets/model.js'
import { Follower } from './model.js'

class FollowersRepository extends GenericRepository<Follower> {
  constructor() {
    super(Follower)
  }

  public async getFollowersAccountIds(accountId: string) {
    const followers = await Follower.findAll({
      where: { followingId: accountId },
      attributes: ['followerId'],
    })

    return followers.map((el) => el.followerId)
  }

  public async getFollowingAccountIds(accountId: string) {
    const following = await Follower.findAll({
      where: { followerId: accountId },
      attributes: ['followingId'],
    })

    return following.map((el) => el.followingId)
  }

  public async getStatsForAccount(accountId: string) {
    const followersCount = await Follower.count({
      where: { followingId: accountId },
    })

    const followingCount = await Follower.count({
      where: { followerId: accountId },
    })

    return { followersCount, followingCount }
  }

  public async getFollowingForAccountPaginated(accountId: string, page: number, perPage: number) {
    return await Follower.findAll({
      where: { followerId: accountId },
      include: [
        {
          model: Account,
          as: 'following',
          attributes: ['id', 'name', 'email', 'picture', 'verified'],
          include: [{ model: Asset, as: 'asset' }],
        },
      ],
      offset: page * perPage,
      limit: perPage,
    })
  }

  public async getFollowersForAccountPaginated(accountId: string, page: number, perPage: number) {
    return await Follower.findAll({
      where: { followingId: accountId },
      include: [
        {
          model: Account,
          as: 'follower',
          attributes: ['id', 'name', 'email', 'picture', 'verified'],
          include: [{ model: Asset, as: 'asset' }],
        },
      ],
      offset: page * perPage,
      limit: perPage,
    })
  }
}

const followersRepositoryInstance = new FollowersRepository()
Object.freeze(followersRepositoryInstance)

export { followersRepositoryInstance as FollowersRepository }
