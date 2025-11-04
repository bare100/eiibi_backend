import { IncomingMessage } from 'http'
import { Server, Socket } from 'socket.io'
import { GENERAL } from '../constants/errors.js'
import { Authenticator } from '../api/middlewares/auth.js'
import { Account } from '../modules/accounts/model.js'

export interface CustomWebSocket extends Socket {
  connectedAt?: number
  account?: Account
}

export interface HandleSocketConnParams {
  req: IncomingMessage
  projectId: string
}

export enum WebsocketEvents {
  NEW_MESSAGE = 'newMessage',
  MESSAGES_REMOVED = 'messagesRemoved',
  COINS_UPDATED = 'coinsUpdated',
  NEW_NOTIFICATION = 'newNotification',
  NEW_CHAT_GROUP = 'newChatGroup',
  ALL_CONNECTED_ACCOUNTS = 'allConnectedAccounts',
  NEW_CONNECTED_ACCOUNT = 'newConnectedAccount',
  ACCOUNT_DISCONNECTED = 'accountDisconnected',
  ACCOUNT_VERIFIED = 'accountVerified',
  NEW_EXCHANGE_RATE = 'newExchangeRate',
}

export class WebSocketModule {
  private wss: Server
  private connections: Record<string, CustomWebSocket> = {}

  constructor(wss: Server) {
    this.wss = wss

    this.wss.on('connection', async (socket) => {
      await this.handleSocketConnection(socket)

      socket.on('close', () => {
        this.handleSocketClose(socket)
      })

      socket.on('disconnect', () => {
        this.handleSocketClose(socket)
      })
    })

    this.wss.on('open', () => {
      // eslint-disable-next-line no-console
      console.log('ws connection opened')
    })

    this.wss.on('close', () => {
      this.closeWSServer()
    })
  }

  accountIsConnected(accountId: string) {
    return Object.values(this.connections ?? {}).some((socket) => socket?.account?.id === accountId)
  }

  getConnectedAccounts() {
    const accountIds = Object.values(this.connections ?? {}).map((socket) => socket?.account?.id)
    const uniqueAccountIds = [...new Set(accountIds)]
    return uniqueAccountIds
  }

  sendEventToAllAccounts(event: WebsocketEvents, data: Record<string, unknown>) {
    Object.values(this.connections).forEach((socket) => {
      this.emit(socket, { type: event, message: data })
    })
  }

  sendEventToAccount(accountId: string, event: WebsocketEvents, data: Record<string, unknown>) {
    const socketsToSendEventTo = Object.keys(this.connections).filter((key) => {
      const socket = this.connections[key]
      return socket?.account?.id === accountId
    })

    if (!socketsToSendEventTo.length) {
      return
    }

    socketsToSendEventTo.forEach((socketId) => {
      const socket = this.connections[socketId]
      this.emit(socket, { type: event, message: data })
    })
  }

  closeWSServer() {
    Object.values(this.connections).forEach((wsId) => {
      Object.values(wsId).forEach((client) => {
        this.handleSocketClose(client)
      })
    })
    this.connections = {}
  }

  private async handleSocketConnection(socket: CustomWebSocket) {
    try {
      const authUser = await Authenticator.authenticateSocket(socket)
      const now = new Date().getTime()

      // Send the new connected account to all connected accounts
      Object.values(this.connections).forEach((connectedSocket) => {
        this.emit(connectedSocket, {
          type: WebsocketEvents.NEW_CONNECTED_ACCOUNT,
          message: authUser.id,
        })
      })

      socket.connectedAt = now
      socket.account = authUser
      this.connections[socket.id] = socket

      this.emit(socket, {
        type: WebsocketEvents.ALL_CONNECTED_ACCOUNTS,
        message: this.getConnectedAccounts(),
      })
    } catch (error) {
      if (error.message === GENERAL.TOKEN_EXPIRED.message) {
        this.handleSocketClose(socket, GENERAL.TOKEN_EXPIRED.message, GENERAL.TOKEN_EXPIRED.code)
        return
      }

      this.handleSocketClose(
        socket,
        GENERAL.SOMETHING_WENT_WRONG,
        GENERAL.SOMETHING_WENT_WRONG_CODE
      )
    }
  }

  private emit(ws: CustomWebSocket, message: Record<string, unknown>) {
    if (!ws.connected) {
      return
    }

    ws.send(JSON.stringify({ custom: true, ...message }))
  }

  private handleSocketClose(socket: CustomWebSocket, message?: string, code?: number) {
    if (message || code) {
      this.emit(socket, { message, code })
    }

    const initialSocketData = this.connections?.[socket?.id || '']
    const socketAccountId = initialSocketData?.account?.id
    socket?.disconnect?.()

    delete this.connections?.[socket?.id || ''] || {}
    if (!socketAccountId && !socket?.account?.id) {
      return
    }

    // Send the disconnected account to all connected accounts
    Object.values(this.connections).forEach((connectedSocket) => {
      this.emit(connectedSocket, {
        type: WebsocketEvents.ACCOUNT_DISCONNECTED,
        message: socketAccountId || socket.account?.id,
      })
    })
  }
}
