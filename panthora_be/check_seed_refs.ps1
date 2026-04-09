$seedDir = "d:\Doan2\panthora_be\src\Infrastructure\Data\Seed\Seeddata"
$errors = @()

function Get-Ids($file, $field) {
    if (-not (Test-Path "$seedDir\$file")) { return @() }
    $data = Get-Content "$seedDir\$file" -Raw | ConvertFrom-Json
    return $data | ForEach-Object { $_.$field } | Where-Object { $_ -ne $null }
}

function Check-Ref($sourceFile, $refField, $targetFile, $targetField) {
    if (-not (Test-Path "$seedDir\$sourceFile")) { return }
    $source = Get-Content "$seedDir\$sourceFile" -Raw | ConvertFrom-Json
    $targetIds = Get-Ids $targetFile $targetField
    $idx = 0
    foreach ($item in $source) {
        $val = $item.$refField
        if ($val -ne $null -and $val -notin $targetIds) {
            $script:errors += "[$sourceFile #$idx] $refField='$val' NOT FOUND in $targetFile.$targetField"
        }
        $idx++
    }
}

function Check-Duplicates($file, $field) {
    if (-not (Test-Path "$seedDir\$file")) { return }
    $data = Get-Content "$seedDir\$file" -Raw | ConvertFrom-Json
    $ids = @{}
    $idx = 0
    foreach ($item in $data) {
        $val = $item.$field
        if ($val -ne $null) {
            if ($ids.ContainsKey($val)) {
                $script:errors += "[$file #$idx] DUPLICATE $field='$val' (first at #$($ids[$val]))"
            } else {
                $ids[$val] = $idx
            }
        }
        $idx++
    }
}

Write-Host "=== Checking duplicate IDs ===" -ForegroundColor Cyan
$files = @("role","user","user-role","department","position","tax-config","pricing-policy",
    "cancellation-policy","deposit-policy","visa-policy","supplier-transport","supplier-hotel",
    "supplier-activity","vehicle","driver","hotel-room-inventory","tour","tour-classification",
    "tour-day","tour-day-activity","tour-plan-location","tour-plan-accommodation","tour-plan-route",
    "tour-instance","tour-instance-manager","tour-instance-day","booking","booking-participant",
    "booking-activity-reservation","booking-transport-detail","booking-accommodation-detail",
    "booking-tour-guide","review","customer-deposit","customer-payment","payment-transaction")
foreach ($f in $files) { Check-Duplicates "$f.json" "Id" }

Write-Host "=== Checking FK references ===" -ForegroundColor Cyan

# user-role -> user, role
Check-Ref "user-role.json" "UserId" "user.json" "Id"
Check-Ref "user-role.json" "RoleId" "role.json" "Id"

# tour-classification -> tour
Check-Ref "tour-classification.json" "TourId" "tour.json" "Id"

# tour-day -> tour-classification
Check-Ref "tour-day.json" "ClassificationId" "tour-classification.json" "Id"

# tour-day-activity -> tour-day
Check-Ref "tour-day-activity.json" "TourDayId" "tour-day.json" "Id"

# tour-plan-location -> tour
Check-Ref "tour-plan-location.json" "TourId" "tour.json" "Id"

# tour-instance -> tour, classification
Check-Ref "tour-instance.json" "TourId" "tour.json" "Id"
Check-Ref "tour-instance.json" "ClassificationId" "tour-classification.json" "Id"

# tour-instance-manager -> tour-instance, user
Check-Ref "tour-instance-manager.json" "TourInstanceId" "tour-instance.json" "Id"
Check-Ref "tour-instance-manager.json" "UserId" "user.json" "Id"

# tour-instance-day -> tour-instance, tour-day
Check-Ref "tour-instance-day.json" "TourInstanceId" "tour-instance.json" "Id"
Check-Ref "tour-instance-day.json" "TourDayId" "tour-day.json" "Id"

# booking -> tour-instance, user
Check-Ref "booking.json" "TourInstanceId" "tour-instance.json" "Id"
Check-Ref "booking.json" "UserId" "user.json" "Id"

# booking-participant -> booking
Check-Ref "booking-participant.json" "BookingId" "booking.json" "Id"

# booking-activity-reservation -> booking
Check-Ref "booking-activity-reservation.json" "BookingId" "booking.json" "Id"

# booking-transport-detail -> booking-activity-reservation
Check-Ref "booking-transport-detail.json" "BookingActivityReservationId" "booking-activity-reservation.json" "Id"

# booking-accommodation-detail -> booking-activity-reservation
Check-Ref "booking-accommodation-detail.json" "BookingActivityReservationId" "booking-activity-reservation.json" "Id"

# booking-tour-guide -> booking, user
Check-Ref "booking-tour-guide.json" "BookingId" "booking.json" "Id"
Check-Ref "booking-tour-guide.json" "UserId" "user.json" "Id"

# customer-deposit -> booking
Check-Ref "customer-deposit.json" "BookingId" "booking.json" "Id"

# customer-payment -> booking, customer-deposit
Check-Ref "customer-payment.json" "BookingId" "booking.json" "Id"
Check-Ref "customer-payment.json" "CustomerDepositId" "customer-deposit.json" "Id"

# payment-transaction -> booking
Check-Ref "payment-transaction.json" "BookingId" "booking.json" "Id"

# review -> user, tour
Check-Ref "review.json" "UserId" "user.json" "Id"
Check-Ref "review.json" "TourId" "tour.json" "Id"

# supplier references
Check-Ref "vehicle.json" "SupplierId" "supplier-transport.json" "Id"
Check-Ref "driver.json" "SupplierId" "supplier-transport.json" "Id"

Write-Host ""
if ($errors.Count -eq 0) {
    Write-Host "ALL CHECKS PASSED - No issues found!" -ForegroundColor Green
} else {
    Write-Host "FOUND $($errors.Count) ISSUE(S):" -ForegroundColor Red
    foreach ($e in $errors) { Write-Host "  - $e" -ForegroundColor Yellow }
}
Write-Host ""
Write-Host "Total seed files: $((Get-ChildItem "$seedDir\*.json").Count)" -ForegroundColor Cyan
