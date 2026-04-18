const { Client } = require('pg');

const client = new Client({
  connectionString: 'Host=34.143.220.132;Port=5432;Database=PPPPathora;Username=postgres;Password=123abc@A;SSL Mode=Disable;'.replace('Host=', 'postgres://').replace(';Port=', ':').replace(';Database=', '/').replace(';Username=', '').replace(';Password=', ':').replace(';SSL Mode=Disable;', ''),
});

// proper connection string: postgres://postgres:123abc%40A@34.143.220.132:5432/PPPPathora

async function test() {
  const c = new Client({ connectionString: 'postgres://postgres:123abc%40A@34.143.220.132:5432/PPPPathora' });
  await c.connect();
  const res = await c.query("SELECT \"Email\", \"Password\" FROM \"Users\" WHERE \"Email\" = 'thehieu1212@gmail.com'");
  console.log('User:', res.rows);
  await c.end();
}
test().catch(console.error);
