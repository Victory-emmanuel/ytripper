import { NextApiRequest, NextApiResponse } from 'next';
import { convertYouTubeVideo } from '../../lib/youtube';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { url, format, videoQuality, audioQuality } = req.body;

  if (!url || !format) {
    return res.status(400).json({ message: 'Missing url or format' });
  }

  try {
    const stream = await convertYouTubeVideo(url, format, videoQuality, audioQuality);

    if (format === 'mp4') {
      res.setHeader('Content-Type', 'video/mp4');
    } else if (format === 'mp3') {
      res.setHeader('Content-Type', 'audio/mpeg');
    }

    stream.pipe(res);
  } catch (error: any) {
    console.error('Error in API endpoint:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
}