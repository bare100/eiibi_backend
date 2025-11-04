import { Request, Response } from 'express'
import { GoogleMapsService } from './service.js'

export class GoogleMapsController {
  public static async getReferenceDetails(req: Request, res: Response) {
    const { referenceId } = req.params
    if (!referenceId) {
      return res.status(400).send({ error: 'Reference ID is required' })
    }

    try {
      const details = await GoogleMapsService.loadGooglePlaceDetails(referenceId)
      return res.status(200).send(details)
    } catch (error) {
      console.error('Cannot get reference details', error)
      res.status(500).send({ error: 'Something went wrong' })
    }
  }

  public static async getDetailsBasedOnLocation(req: Request, res: Response) {
    const { lat, lng } = req.params
    if (!lat || !lng) {
      return res.status(400).send({ error: 'Latitude and longitude are required' })
    }

    try {
      const details = await GoogleMapsService.loadDetailsBasedOnLocation(
        parseFloat(lat as string),
        parseFloat(lng as string)
      )
      return res.status(200).send(details)
    } catch (error) {
      console.error('Cannot get details based on location', error)
      res.status(500).send({ error: 'Something went wrong' })
    }
  }

  public static async searchByKeyword(req: Request, res: Response) {
    const { keyword } = req.params
    if (!keyword) {
      return res.status(400).send({ error: 'Keyword is required' })
    }

    try {
      const details = await GoogleMapsService.loadGooglePlacesByKeyword(keyword as string)
      return res.status(200).send(details)
    } catch (error) {
      console.error('Cannot search by keyword', error)
      res.status(500).send({ error: 'Something went wrong' })
    }
  }
}
