import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'pg';
import { getSession } from 'next-auth/react';  // <-- Import getSession from next-auth

// Instantiate the PostgreSQL client for CockroachDB
const client = new Client({
  connectionString: 'postgresql://dashboard:wZCyQgMUCcOw3ppdNT7Wlg@dashboard-4236.jxf.gcp-asia-southeast1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full',
});

client.connect();

// API endpoint for linking Gmail account to the user
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure the request is a POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Get user session using next-auth
  const session = await getSession({ req });

  if (!session || !session.user || !session.user.email) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { email } = req.body; // Get email from the request body

  // Check if email is provided
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Check if the email already exists in the database
    const result = await client.query('SELECT * FROM users WHERE gmail = $1', [email]);

    if (result.rows.length > 0) {
      return res.status(400).json({ message: 'This Gmail account is already linked to another user.' });
    }

    // Update the user in the database to link the Gmail account using their email
    const updateResult = await client.query(
      'UPDATE users SET gmail = $1 WHERE email = $2 RETURNING *',
      [email, session.user.email]  // Use session.user.email instead of session.user.id
    );

    // Respond with success
    if (updateResult.rows.length > 0) {
      return res.status(200).json({
        message: 'Gmail account linked successfully',
        user: updateResult.rows[0],
      });
    } else {
      return res.status(400).json({ message: 'Failed to update user with Gmail.' });
    }
  } catch (error) {
    console.error('Error linking Gmail:', error);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  } finally {
    // Close the database connection after handling the request
    client.end();
  }
}
