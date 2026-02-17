import { neon } from '@netlify/neon';
import bcrypt from 'bcryptjs';

const buildResponse = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return buildResponse(405, { message: 'Method Not Allowed' });
  }

  try {
    const { username, password, role } = JSON.parse(event.body);

    if (!username || !password || !role) {
      return buildResponse(400, { message: 'Username, password, and role are required.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const sql = neon();

    // Insert the new user with the hashed password
    await sql`
      INSERT INTO users (username, password, role) 
      VALUES (${username}, ${hashedPassword}, ${role})
    `;

    return buildResponse(201, { success: true, message: 'Registration successful!' });

  } catch (error) {
    console.error('Registration Error:', error);
    // Check for unique constraint violation (duplicate username)
    if (error.code === '23505') {
      return buildResponse(409, { success: false, message: 'Username already taken.' });
    }
    return buildResponse(500, { success: false, message: 'An internal server error occurred.' });
  }
};