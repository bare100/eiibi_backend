import { Request } from 'express'
import { GENERAL } from '../../constants/errors.js'
import { ReportRepository } from './repository.js'

export class ReportsController {
  public static async create(req: Request, res) {
    const { account } = res.locals
    const { entityName, reason, entityId, description } = req.body

    try {
      if (!account.email) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      const report = await ReportRepository.create({
        entityName,
        entityId,
        reason,
        description,
        reportedBy: account.id,
      })

      return res.status(200).json(report)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }
}
