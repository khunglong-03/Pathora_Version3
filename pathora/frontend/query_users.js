const { Client } = require('pg');

const client = new Client({
  host: '52.77.116.210',
  port: 3306,
  database: 'Pathora',
  user: 'postgres',
  password: 'G67_Pathora',
  ssl: false
});

async function main() {
  await client.connect();

  const res = await client.query(
    'SELECT * FROM "Users" LIMIT 10'
  );
  
  console.log('Users:', JSON.stringify(res.rows, null, 2));

  await client.end();
}

main().catch(err => {
  console.error('Error running DB query:', err);
  process.exit(1);
});
