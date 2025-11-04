import multer from 'multer'

const storage = multer.memoryStorage()
const upload = multer({ storage: storage }).array('files')

export const uploadFile = (req, res) => {
  return new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve(req.files.files)
      }
    })
  })
}
