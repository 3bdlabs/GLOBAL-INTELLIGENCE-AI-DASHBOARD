import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const token = process.env.ACLED_ACCESS_TOKEN;
const email = process.env.ACLED_EMAIL;
const password = process.env.ACLED_PASSWORD;

console.log('--- ACLED Auth Test ---');
console.log('Token length:', token?.length || 0);
console.log('Email:', email || 'Not set');

async function testAcled() {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const params = new URLSearchParams({
    event_type: 'Protests',
    event_date: `${startDate}|${endDate}`,
    event_date_where: 'BETWEEN',
    limit: '10',
    _format: 'json',
  });

  const url = `https://acleddata.com/api/acled/read?${params}`;
  console.log('Request URL:', url);

  try {
    const resp = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Status:', resp.status);
    const text = await resp.text();
    console.log('Response:', text.slice(0, 500));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testAcled();
