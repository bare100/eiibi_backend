import { validate as uuidValidate } from 'uuid'
import sequelize, { FindOptions } from 'sequelize'
import { Fn, Col, Literal } from 'sequelize/types/utils'

export class GenericRepository<T extends sequelize.Model<T>> {
  public model: any

  constructor(model: unknown) {
    this.model = model
  }

  public async create(
    element: Partial<T>,
    transaction?: sequelize.Transaction
  ): Promise<T> {
    return this.model.create({ ...element }, { transaction })
  }

  public async createBulk(
    elements: Partial<T>[],
    transaction?: sequelize.Transaction
  ) {
    return this.model.bulkCreate(elements, { transaction })
  }

  public async findAll(
    options: FindOptions,
    transaction?: sequelize.Transaction
  ): Promise<T[]> {
    return this.model.findAll(options, { transaction })
  }

  public async findOne(
    options: FindOptions,
    transaction?: sequelize.Transaction
  ): Promise<T> {
    return this.model.findOne(options, { transaction })
  }

  public async getOneById(
    id: sequelize.Identifier,
    transaction?: sequelize.Transaction
  ): Promise<T> {
    return this.model.findByPk(id, { transaction })
  }

  public async getOneByIdOrFail(
    id: sequelize.Identifier,
    transaction?: sequelize.Transaction,
    paranoid = true
  ): Promise<T> {
    if (!uuidValidate(id.toString())) {
      throw new Error('Invalid id')
    }

    const result = await this.model.findByPk(id, { transaction, paranoid })
    if (result) {
      return result
    }

    const name = this.model.name
    const entityName = name.charAt(0).toUpperCase() + name.slice(1)
    throw new Error(`${entityName.slice(0, -1)} does not exist`)
  }

  public async update(
    findCondition: {
      [key in keyof T['_attributes']]?:
        | T['_attributes'][key]
        | Fn
        | Col
        | Literal
    },
    attributes: Partial<T>,
    transaction?: sequelize.Transaction,
    silent = false,
    returning = true
  ): Promise<[number, T[]]> {
    return this.model.update(
      { ...attributes },
      { where: { ...findCondition }, transaction, silent, returning }
    )
  }

  public async deleteById(
    id: sequelize.Identifier,
    transaction?: sequelize.Transaction
  ): Promise<number> {
    return this.model.destroy({ where: { id }, transaction })
  }

  public async deleteManyByIds(
    ids: string[],
    transaction?: sequelize.Transaction
  ): Promise<number> {
    return this.model.destroy({
      where: { id: { [sequelize.Op.in]: ids } },
      transaction,
    })
  }
}
