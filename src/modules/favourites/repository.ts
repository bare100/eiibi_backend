import { GenericRepository } from '../../lib/base-repository.js'
import { Account } from '../accounts/model.js'
import { Asset } from '../assets/model.js'
import { Post } from '../posts/model.js'
import { PostsRepository } from '../posts/repository.js'
import { Favourite } from './model.js'

class FavouritesRepository extends GenericRepository<Favourite> {
  constructor() {
    super(Favourite)
  }

  public async getAccountsWhoAddedPostToFavourites(postId: string, page = 0, perPage = 20) {
    const favourites = await this.findAll({
      where: { postId },
      include: [
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'name', 'email', 'picture', 'verified'],
          include: [{ model: Asset, as: 'asset' }],
        },
      ],
      offset: page * perPage,
      limit: perPage,
    })

    return favourites
      .map((favourite) => (favourite.account?.email ? favourite.account : null))
      .filter((el) => el)
  }

  public async getFavouritePosts(accountId: string) {
    return await this.findAll({
      where: { accountId },
      include: [
        {
          model: Post,
          as: 'post',
          attributes: ['id', 'vectors'],
        },
      ],
    })
  }

  public async getFavouritesByAccountId(accountId: string) {
    const postsForAccount = await this.findAll({ where: { accountId } })
    const postIds = postsForAccount.map((post) => post.postId)

    return PostsRepository.findByIds(postIds)
  }
}

const favouritesRepositoryInstance = new FavouritesRepository()
Object.freeze(favouritesRepositoryInstance)

export { favouritesRepositoryInstance as FavouritesRepository }
