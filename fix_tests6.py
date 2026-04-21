import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # GetTourContinentByRouteIdAsync -> GetTourContinentByActivityIdAsync
    content = content.replace('GetTourContinentByRouteIdAsync', 'GetTourContinentByActivityIdAsync')
    content = content.replace('TourPlanRouteId', 'TourDayActivityId')

    with open(filepath, 'w') as f:
        f.write(content)

fix_file('panthora_be/tests/Domain.Specs/Application/Validators/RouteTransportAssignmentRequestDtoValidatorTests.cs')

