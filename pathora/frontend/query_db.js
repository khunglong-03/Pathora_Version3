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
  console.log('Querying InProgress TourInstances...');
  const resTours = await client.query(
    'SELECT "Id", "TourCode", "Status" FROM "TourInstances" WHERE "Status" = \'InProgress\''
  );
  console.log('InProgress TourInstances:', JSON.stringify(resTours.rows, null, 2));

  for (const tour of resTours.rows) {
    console.log(`\n--- Tour Instance ${tour.TourCode} (${tour.Id}) ---`);
    const resDays = await client.query(
      'SELECT "Id", "InstanceDayNumber", "Title", "TourDayId" FROM "TourInstanceDays" WHERE "TourInstanceId" = $1 ORDER BY "InstanceDayNumber"',
      [tour.Id]
    );
    console.log('Days:', JSON.stringify(resDays.rows, null, 2));
    
    for (const day of resDays.rows) {
      const resActivities = await client.query(
        'SELECT "Id", "Title", "Order" FROM "TourInstanceDayActivities" WHERE "TourInstanceDayId" = $1 ORDER BY "Order"',
        [day.Id]
      );
      console.log(`Day ${day.InstanceDayNumber} Activities:`, JSON.stringify(resActivities.rows, null, 2));
    }

    const resStatuses = await client.query(
      'SELECT "TourDayId", "ActivityStatus", "Note" FROM "TourDayActivityStatuses" WHERE "BookingId" IN (SELECT "Id" FROM "Bookings" WHERE "TourInstanceId" = $1)',
      [tour.Id]
    );
    console.log('Statuses in DB:', JSON.stringify(resStatuses.rows, null, 2));
  } console.log('Querying TourInstance...');
  const bookingId = '019e9925-6668-796f-8590-960e31b0d95b';
  const resTour = await client.query('SELECT "Id", "Status" FROM "TourInstances" WHERE "Id" = (SELECT "TourInstanceId" FROM "Bookings" WHERE "Id" = $1)', [bookingId]);
  console.log('TourInstance:', JSON.stringify(resTour.rows, null, 2));

  await client.end();
}

main().catch(console.error);
