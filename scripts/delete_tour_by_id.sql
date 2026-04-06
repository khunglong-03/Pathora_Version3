-- =============================================
-- HARD DELETE: Xoa han toan bo du lieu cua 1 tour
-- Database: PostgreSQL (panthora_be)
-- Dieu kien: Tat ca cac bang phu thuoc deu da duoc xu ly dung thu tu
-- =============================================
-- Huong dan su dung:
--   1. Thay 'YOUR_TOUR_ID_HERE' bang UUID thuc te cua tour
--   2. Chay script trong transaction - neu gap loi, toan bo rollback
--   3. Kiem tra ket qua: SELECT * FROM "Tours" WHERE "Id" = 'YOUR_TOUR_ID_HERE';
--
-- Ví du UUID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
-- =============================================

DO $$
DECLARE
    v_tour_id UUID := 'YOUR_TOUR_ID_HERE';
    v_step TEXT;
    v_deleted_count INT;
BEGIN
    -- ============================================================
    -- CAC BANG CO RESTRICT FK - PHAI XOA TRUOC
    -- PostgreSQL se tu dong CASCADE xoa cac bang con cua chung
    -- ============================================================

    -- 1. Reviews (Restrict FK: TourId)
    --    Cascade: Xoa TourPlanLocations, TourResources, TourClassifications,
    --             TourInsurances, TourDays, TourDayActivities,
    --             TourPlanAccommodations, TourPlanRoutes,
    --             TourDayActivityResourceLinks, TourImages
    v_step := 'Reviews';
    DELETE FROM "Reviews" WHERE "TourId" = v_tour_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '[%] Da xoa % dong Reviews', v_step, v_deleted_count;

    -- 2. TourRequests (Restrict FK: TourInstanceId)
    v_step := 'TourRequests';
    DELETE FROM "TourRequests"
    WHERE "TourInstanceId" IN (
        SELECT "Id" FROM "TourInstances" WHERE "TourId" = v_tour_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '[%] Da xoa % dong TourRequests', v_step, v_deleted_count;

    -- 3. PaymentTransactions (Restrict FK: BookingId)
    --    CAN NGAN chan xoa Bookings neu khong xoa truoc
    v_step := 'PaymentTransactions';
    DELETE FROM "PaymentTransactions"
    WHERE "BookingId" IN (
        SELECT b."Id" FROM "Bookings" b
        JOIN "TourInstances" ti ON b."TourInstanceId" = ti."Id"
        WHERE ti."TourId" = v_tour_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '[%] Da xoa % dong PaymentTransactions', v_step, v_deleted_count;

    -- 4. TourDayActivityStatuses (Restrict FK: TourDayId)
    --    CAN NGAN chan xoa TourDays neu khong xoa truoc
    v_step := 'TourDayActivityStatuses';
    DELETE FROM "TourDayActivityStatuses"
    WHERE "TourDayId" IN (
        SELECT td."Id" FROM "TourDays" td
        JOIN "TourClassifications" tc ON td."ClassificationId" = tc."Id"
        WHERE tc."TourId" = v_tour_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '[%] Da xoa % dong TourDayActivityStatuses', v_step, v_deleted_count;

    -- 5. TourInstanceDays (Restrict FK: TourDayId)
    --    CAN NGAN chan xoa TourDays neu khong xoa truoc
    v_step := 'TourInstanceDays';
    DELETE FROM "TourInstanceDays"
    WHERE "TourInstanceId" IN (
        SELECT "Id" FROM "TourInstances" WHERE "TourId" = v_tour_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '[%] Da xoa % dong TourInstanceDays', v_step, v_deleted_count;

    -- 6. Bookings (Restrict FK: TourInstanceId)
    --    CASCADE tu dong xoa: BookingParticipants, Passports, VisaApplications,
    --             BookingActivityReservations, BookingTransportDetails,
    --             BookingAccommodationDetails, BookingTourGuides,
    --             CustomerDeposits, CustomerPayments, SupplierPayables,
    --             SupplierReceipts, TourDayActivityStatuses
    v_step := 'Bookings';
    DELETE FROM "Bookings"
    WHERE "TourInstanceId" IN (
        SELECT "Id" FROM "TourInstances" WHERE "TourId" = v_tour_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '[%] Da xoa % dong Bookings', v_step, v_deleted_count;

    -- 7. TourInstances (Restrict FK: TourId)
    --    CASCADE tu dong xoa: TourInstanceManagers, TourInstanceImages,
    --             TourInstanceDays, Bookings (da xoa o tren)
    v_step := 'TourInstances';
    DELETE FROM "TourInstances" WHERE "TourId" = v_tour_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '[%] Da xoa % dong TourInstances', v_step, v_deleted_count;

    -- 8. Tours (ROOT - xoa cuoi cung)
    --    CASCADE tu dong xoa: TourClassifications, TourDays, TourDayActivities,
    --             TourInsurances, TourPlanLocations, TourResources, TourImages
    v_step := 'Tours';
    DELETE FROM "Tours" WHERE "Id" = v_tour_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    IF v_deleted_count = 0 THEN
        RAISE WARNING 'Khong tim thay tour voi ID: %', v_tour_id;
    ELSE
        RAISE NOTICE '=============================================';
        RAISE NOTICE 'Xoa tour % thanh cong!', v_tour_id;
        RAISE NOTICE '% dong da duoc xoa khoi he thong.', v_deleted_count;
        RAISE NOTICE '=============================================';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION
            'LOI TAI BUOC: [%] | Thong diep: % | SQLSTATE: %',
            v_step,
            SQLERRM,
            SQLSTATE;
END $$;

-- ============================================================
-- Kiem tra ket qua (chay sau khi script thanh cong)
-- ============================================================
-- SELECT 'Tours' AS table_name, COUNT(*) AS remaining_rows
-- FROM "Tours" WHERE "Id" = 'YOUR_TOUR_ID_HERE'
-- UNION ALL
-- SELECT 'TourInstances', COUNT(*)
-- FROM "TourInstances" WHERE "TourId" = 'YOUR_TOUR_ID_HERE'
-- UNION ALL
-- SELECT 'Bookings', COUNT(*)
-- FROM "Bookings"
-- WHERE "TourInstanceId" IN (
--     SELECT "Id" FROM "TourInstances" WHERE "TourId" = 'YOUR_TOUR_ID_HERE'
-- );
