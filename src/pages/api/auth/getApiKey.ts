import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

// Koneksi ke database CockroachDB
const pool = new Pool({
  connectionString:
    'postgresql://jkt48connect_apikey:vAgy5JNXz4woO46g8fho4g@jkt48connect-7018.j77.aws-ap-southeast-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const client = await pool.connect();
    const { rows } = await client.query(
      'SELECT api_key FROM api_keys WHERE user_id = $1',
      [userId]
    );

    client.release();

    if (rows.length > 0) {
      return res.status(200).json({ apiKey: rows[0].api_key });
    } else {
      return res.status(404).json({ error: 'API key not found for this user' });
    }
  } catch (err) {
    console.error('Error fetching API key:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
