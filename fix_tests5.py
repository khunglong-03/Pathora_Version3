import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # GetTourContinentByRouteIdAsync -> GetTourContinentByActivityIdAsync
    content = content.replace('GetTourContinentByRouteIdAsync', 'GetTourContinentByActivityIdAsync')

    with open(filepath, 'w') as f:
        f.write(content)

fix_file('panthora_be/tests/Domain.Specs/Application/TourTransportAssignment/AssignRouteTransportCommandHandlerTests.cs')

def fix_tour_service_tests():
    filepath = 'panthora_be/tests/Domain.Specs/Application/Services/TourServiceTests.cs'
    with open(filepath, 'r') as f:
        content = f.read()

    # Assert.Single(cls.Plans[0].Activities[0].Routes);
    content = re.sub(r'Assert\.Single\([^.]+\.Plans\[0\]\.Activities\[0\]\.Routes\);', '', content)
    
    # 1250: activity already defined in this scope
    # Let's fix lines around 1250
    content = content.replace('var activity = TourDayActivityEntity.Create(day.Id, 1, Domain.Enums.TourDayActivityType.Transportation, "Trans", "admin@test.com", transportationType: Domain.Enums.TransportationType.Car);',
                              'var routeActivity = TourDayActivityEntity.Create(day.Id, 1, Domain.Enums.TourDayActivityType.Transportation, "Trans", "admin@test.com", transportationType: Domain.Enums.TransportationType.Car);')

    with open(filepath, 'w') as f:
        f.write(content)

fix_tour_service_tests()
