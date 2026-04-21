import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # TourPlanRouteEntity to TourDayActivityEntity
    content = content.replace('TourPlanRouteEntity', 'TourDayActivityEntity')
    content = content.replace('TourPlanRoute', 'TourDayActivity')
    content = content.replace('TourPlanRouteId', 'TourDayActivityId')

    # Fix TourDayActivityEntity.Create(1, Domain.Enums.TransportationType.Car, "admin@test.com");
    # We want: TourDayActivityEntity.Create(dayId, 1, TourDayActivityType.Transport, "Transport", "admin@test.com", transportationType: Domain.Enums.TransportationType.Car)
    # But wait, in the test it was:
    # var route = TourDayActivityEntity.Create(1, Domain.Enums.TransportationType.Car, "admin@test.com");
    content = re.sub(r'var route = TourDayActivityEntity\.Create\(\s*\d+,\s*Domain\.Enums\.TransportationType\.([^,]+),\s*"[^"]+"\s*\);',
                     r'var route = TourDayActivityEntity.Create(day.Id, 1, Domain.Enums.TourDayActivityType.Transport, "Trans", "admin@test.com", transportationType: Domain.Enums.TransportationType.\1);', content)

    # In GetBookingTransportInfoQueryHandlerTests.cs, `new TourDayActivityEntity { Id = ... }` might fail if properties are init-only or have private setters, but let's assume it works or replace it.
    
    with open(filepath, 'w') as f:
        f.write(content)

import glob
for file in glob.glob('panthora_be/tests/Domain.Specs/**/*.cs', recursive=True):
    fix_file(file)

