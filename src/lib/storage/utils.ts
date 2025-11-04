import jimp from 'jimp'
import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'

export const compressFile = (buffer: Buffer, mimetype: string) => {
  return new Promise<Buffer>((resolve, reject) => {
    jimp.read(buffer, (err, image) => {
      if (err) {
        reject(err)
      }
      try {
        image.quality(70).getBuffer(mimetype, (err, buffer) => {
          if (err) {
            reject(err)
          }
          resolve(buffer)
        })
      } catch (error) {
        reject(error)
      }
    })
  })
}

export const generateDiskUploadsDir = () => {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const rootDir = resolve(__dirname)
  return join(rootDir, '../../uploads')
}
