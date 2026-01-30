const https = require('https');

const US_ATLAS_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/us/10m.json';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  const topology = await fetchJson(US_ATLAS_URL);
  const geometries = topology?.objects?.states?.geometries || [];
  const hasIndiana = geometries.some((geometry) => String(geometry.id).padStart(2, '0') === '18');

  if (!hasIndiana) {
    throw new Error('Indiana (IN) is missing from US Atlas topology.');
  }

  console.log('Indiana (IN) is present in US Atlas topology.');
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
