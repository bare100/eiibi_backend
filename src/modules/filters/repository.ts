import { GenericRepository } from '../../lib/base-repository.js'
import { FilterItem } from './model.js'

class FiltersRepository extends GenericRepository<FilterItem> {
  constructor() {
    super(FilterItem)
  }
}

const filterRepositoryInstance = new FiltersRepository()
Object.freeze(filterRepositoryInstance)

export { filterRepositoryInstance as FiltersRepository }
