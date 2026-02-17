import { neon } from '@netlify/neon';
import bcrypt from 'bcryptjs';

// Helper to build standard API responses for Netlify Functions
const buildResponse = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return buildResponse(405, { message: 'Method Not Allowed' });
  }

  try {
    const { username, password } = JSON.parse(event.body);

    if (!username || !password) {
      return buildResponse(400, { message: 'Username and password are required.' });
    }

    const sql = neon(); // Automatically uses NETLIFY_DATABASE_URL

    // Fetch user by username to get the stored password hash
    const users = await sql`
      SELECT username, role, password 
      FROM users 
      WHERE username = ${username}
    `;

    if (users.length === 0) {
      // User not found
      return buildResponse(401, { success: false, message: 'Invalid credentials.' });
    }

    const user = users[0]; // The user from the database including the hashed password

    // Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return buildResponse(401, { success: false, message: 'Invalid credentials.' });
    }

    // Password is correct, return user data (without the password hash)
    return buildResponse(200, { success: true, user: { username: user.username, role: user.role } });

  } catch (error) {
    console.error('Error in login function:', error);
    return buildResponse(500, { success: false, message: 'An internal server error occurred.' });
  }
};