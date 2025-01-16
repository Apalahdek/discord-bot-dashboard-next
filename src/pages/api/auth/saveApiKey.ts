import { NextApiRequest, NextApiResponse } from "next";
import { Pool } from "pg";

// Koneksi database PostgreSQL
const pool = new Pool({
  connectionString:
    "postgresql://jkt48connect_apikey:vAgy5JNXz4woO46g8fho4g@jkt48connect-7018.j77.aws-ap-southeast-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full",
});

// Fungsi untuk menyimpan dan menyinkronkan API Key dengan database
const saveApiKey = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const { apiKey, expiryDate, limit, seller } = req.body;

    if (!apiKey || !expiryDate || !limit) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    try {
      const client = await pool.connect();

      // Format tanggal expiryDate dan lainnya
      const expiryDateFormatted = expiryDate;
      const remainingRequests = String(limit);
      const maxRequests = String(limit);
      const now = new Date();
      const lastAccessDate = now.toISOString().split("T")[0]; // Hanya mengambil YYYY-MM-DD

      // Cek apakah API key sudah ada di database
      const checkQuery = `SELECT * FROM api_keys WHERE api_key = $1`;
      const checkResult = await client.query(checkQuery, [apiKey]);

      if (checkResult.rows.length === 0) {
        // Jika API key belum ada, insert data baru
        const insertQuery = `
          INSERT INTO api_keys (api_key, expiry_date, remaining_requests, max_requests, last_access_date, seller)
          VALUES ($1, $2, $3, $4, $5, $6) RETURNING api_key
        `;
        const insertResult = await client.query(insertQuery, [
          apiKey,
          expiryDateFormatted,
          remainingRequests,
          maxRequests,
          lastAccessDate,
          seller || false,
        ]);

        // Periksa apakah API key berhasil disimpan
        if (insertResult && insertResult.rows.length > 0) {
          return res.status(200).json({
            message: "API Key successfully created",
            apiKey: insertResult.rows[0].api_key,
          });
        } else {
          return res.status(500).json({ message: "Failed to create API Key" });
        }
      } else {
        // Jika API key sudah ada, perbarui data
        const existingKeyData = checkResult.rows[0];

        // Cek apakah ada perubahan yang perlu diperbarui
        if (
          existingKeyData.expiry_date !== expiryDateFormatted ||
          existingKeyData.remaining_requests !== remainingRequests ||
          existingKeyData.max_requests !== maxRequests ||
          existingKeyData.last_access_date !== lastAccessDate ||
          existingKeyData.seller !== (seller || false)
        ) {
          const updateQuery = `
            UPDATE api_keys 
            SET expiry_date = $2, remaining_requests = $3, max_requests = $4, last_access_date = $5, seller = $6
            WHERE api_key = $1
          `;
          await client.query(updateQuery, [
            apiKey,
            expiryDateFormatted,
            remainingRequests,
            maxRequests,
            lastAccessDate,
            seller || false,
          ]);

          return res.status(200).json({
            message: `API Key ${apiKey} successfully updated.`,
            apiKey,
          });
        } else {
          return res.status(200).json({
            message: `No changes detected for API Key ${apiKey}.`,
            apiKey,
          });
        }
      }

      client.release();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error saving or updating API Key:", error);
        return res.status(500).json({ message: `Internal server error: ${error.message}` });
      } else {
        console.error("Unknown error:", error);
        return res.status(500).json({ message: "Unknown error occurred." });
      }
    }
  } else {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
};

export default saveApiKey;
