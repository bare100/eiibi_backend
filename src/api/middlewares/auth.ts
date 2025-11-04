import { NextFunction, Request, Response } from 'express'
import { GENERAL } from '../../constants/errors.js'
import { Account } from '../../modules/accounts/model.js'
import { AccountsRepository } from '../../modules/accounts/repository.js'
import { CustomWebSocket } from '../../ws/socket-module.js'
import { getAuth } from 'firebase-admin/auth'

interface UserData {
  authId: string
  email: string
  name: string
  picture: string
  identities: Record<string, string[]>
  phone?: string
}

export class Authenticator {
  public static async authenticateHttp() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.headers.authorization) {
          return res.status(400).send({ error: GENERAL.FORBIDDEN })
        }

        const accessToken = req.headers.authorization
        const userData = await Authenticator.getUserData(accessToken)
        const account = await AccountsRepository.findOneOrCreate(
          userData.authId,
          userData,
          userData.identities,
          userData.phone
        )

        const accountData = {
          ...account.toJSON(),
        }

        accountData.email = accountData.rawEmail
        delete accountData.authId

        res.locals.account = accountData
        next()
      } catch (error) {
        if (
          error.errorInfo &&
          (error.errorInfo?.code === 'auth/id-token-expired' ||
            error.errorInfo?.code === 'auth/argument-error')
        ) {
          console.warn('http - ', GENERAL.TOKEN_EXPIRED.message)
          return res
            .status(GENERAL.TOKEN_EXPIRED.code)
            .send({ error: GENERAL.TOKEN_EXPIRED.message })
        }

        console.error(error)
        return res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
      }
    }
  }

  public static async authenticateToken(token: string) {
    try {
      const userData = await Authenticator.getUserData(token)
      return await AccountsRepository.findOne({
        where: { authId: userData.authId },
      })
    } catch (error) {
      return null
    }
  }

  public static async authenticateSocket(socket: CustomWebSocket): Promise<Account> | undefined {
    let jwtToken = socket.handshake.headers.token

    if (!jwtToken) {
      const searchQueryParamsToken = socket.handshake.query.token
      if (!searchQueryParamsToken) {
        throw new Error(GENERAL.FORBIDDEN)
      }
      jwtToken = searchQueryParamsToken as string
    }

    try {
      const userData = await this.getUserData(jwtToken as string)
      const account: Account = await AccountsRepository.findOne({
        where: { authId: userData.authId },
      })

      return account
    } catch (error) {
      if (
        error.errorInfo &&
        (error.errorInfo?.code === 'auth/id-token-expired' ||
          error.errorInfo?.code === 'auth/argument-error')
      ) {
        throw new Error('Socket - ' + GENERAL.TOKEN_EXPIRED.message)
      }

      throw new Error(GENERAL.FORBIDDEN)
    }
  }

  private static async getUserData(jwtToken: string) {
    const decodedToken = await getAuth().verifyIdToken(jwtToken)
    const identities = decodedToken.firebase.identities
    Object.keys(identities).forEach((identity) => {
      identities[identity.split('.').join('-')] = identities[identity]
      delete identities[identity]
    })

    return {
      authId: decodedToken.user_id,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
      phone: decodedToken.phone_number,
      identities,
    } as UserData
  }
}
