import pg from 'pg';
const client = new pg.Client({
  host: '34.143.220.132',
  port: 5432,
  database: 'PPPPathora',
  user: 'postgres',
  password: '123abc@A',
  ssl: false,
});

try {
  await client.connect();

  const { rows: users } = await client.query(`
    SELECT
        u."Id"          AS "UserId",
        u."Email"       AS "LoginEmail",
        u."FullName",
        s."Id"          AS "SupplierId",
        s."Name"        AS "SupplierName",
        s."SupplierType",
        CASE
            WHEN ti_hotel."cnt" > 0 THEN 'YES'
            ELSE 'NO'
        END AS "HasPendingHotelApproval",
        CASE
            WHEN ti_transport."cnt" > 0 THEN 'YES'
            ELSE 'NO'
        END AS "HasPendingTransportApproval"
    FROM "Users" u
    JOIN "Suppliers" s ON u."Id" = s."OwnerUserId"
    LEFT JOIN LATERAL (
        SELECT COUNT(*) AS "cnt"
        FROM "TourInstances" ti
        WHERE ti."HotelProviderId" = s."Id"
          AND ti."HotelApprovalStatus" = 1
          AND ti."IsDeleted" = false
    ) ti_hotel ON true
    LEFT JOIN LATERAL (
        SELECT COUNT(*) AS "cnt"
        FROM "TourInstances" ti
        WHERE ti."TransportProviderId" = s."Id"
          AND ti."TransportApprovalStatus" = 1
          AND ti."IsDeleted" = false
    ) ti_transport ON true
    WHERE s."OwnerUserId" IS NOT NULL
      AND (ti_hotel."cnt" > 0 OR ti_transport."cnt" > 0)
    ORDER BY s."SupplierType", u."Email";
  `);

  console.log('\n=== USERS NEEDING TO APPROVE (USE EMAILS BELOW TO LOGIN) ===');
  console.table(users);
} catch (e) {
  console.error("DB Error:", e.message);
} finally {
  await client.end();
}
