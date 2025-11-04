import { GenericRepository } from '../../lib/base-repository.js'
import { Report } from './model.js'

class ReportRepository extends GenericRepository<Report> {
  constructor() {
    super(Report)
  }
}

const reportRepositoryInstance = new ReportRepository()
Object.freeze(reportRepositoryInstance)

export { reportRepositoryInstance as ReportRepository }
