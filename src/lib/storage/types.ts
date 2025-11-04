import { Response } from 'express'

export type ExpressFile = Express.Multer.File

export interface StorageHandler {
  upload: (file: ExpressFile) => Promise<ExpressFile>
  delete: (path: string) => Promise<void>
  sendToClient: (path: string, res: Response) => void
}
