import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # TourDayActivityType.Transport -> TourDayActivityType.Transportation
    content = content.replace('TourDayActivityType.Transport,', 'TourDayActivityType.Transportation,')
    
    # In TourServiceTests.cs, line 1721-1724:
    # var route = TourDayActivityEntity.Create(day.Id, 1, Domain.Enums.TourDayActivityType.Transportation, "Trans", "admin@test.com", transportationType: Domain.Enums.TransportationType.Car);
    # activity.Id = routeId;
    # activity.FromLocation = fromLocation;
    # activity.ToLocation = toLocation;
    # 
    # var activity = TourDayActivityEntity.Create(...)
    
    # We should fix 'activity.Id = routeId;' because activity is not declared yet! It should be 'route.Id = routeId; route.FromLocation = fromLocation; route.ToLocation = toLocation;'
    content = re.sub(r'var route = TourDayActivityEntity\.Create([^;]+);\s*activity\.Id = routeId;\s*activity\.FromLocation = fromLocation;\s*activity\.ToLocation = toLocation;',
                     r'var activity = TourDayActivityEntity.Create\1;\n        activity.Id = routeId;\n        activity.FromLocation = fromLocation;\n        activity.ToLocation = toLocation;', content)

    # But wait, later there is `var activity = TourDayActivityEntity.Create(...)`. It re-declares `activity`? Let's just change `var route` to `var routeActivity` and fix references.
    # It's easier to just do:
    content = content.replace('var route = TourDayActivityEntity.Create(day.Id, 1, Domain.Enums.TourDayActivityType.Transportation, "Trans", "admin@test.com", transportationType: Domain.Enums.TransportationType.Car);',
                              'var routeActivity = TourDayActivityEntity.Create(day.Id, 1, Domain.Enums.TourDayActivityType.Transportation, "Trans", "admin@test.com", transportationType: Domain.Enums.TransportationType.Car);')
    content = content.replace('activity.Id = routeId;\n        activity.FromLocation = fromLocation;\n        activity.ToLocation = toLocation;',
                              'routeActivity.Id = routeId;\n        routeActivity.FromLocation = fromLocation;\n        routeActivity.ToLocation = toLocation;')
    content = content.replace('activity.Routes.Add(routeActivity);', '')
    content = content.replace('day.Activities.Add(activity);', 'day.Activities.Add(activity);\n        day.Activities.Add(routeActivity);')
    
    content = content.replace('route.Id = routeId', 'routeActivity.Id = routeId')
    content = content.replace('route.FromLocation', 'routeActivity.FromLocation')
    content = content.replace('route.ToLocation', 'routeActivity.ToLocation')

    # Also lines 1407, 1408, 1472, 1474, 1475: activity does not exist
    # var route = capturedTour!.Classifications[0].Plans[0].Activities[0];
    # Assert.Single(activity.Routes);
    # This was previously var route = capturedTour!.Classifications[0].Plans[0].Activities[0].Routes[0];
    content = re.sub(r'Assert\.Equal\("Airport", activity\.FromLocation!\.LocationName\);', r'Assert.Equal("Airport", route.FromLocation!.LocationName);', content)
    content = re.sub(r'Assert\.Equal\("Hotel", activity\.ToLocation!\.LocationName\);', r'Assert.Equal("Hotel", route.ToLocation!.LocationName);', content)
    content = re.sub(r'Assert\.Equal\("Bus", activity\.TransportationType\.ToString\(\)\);', r'Assert.Equal("Bus", route.TransportationType.ToString());', content)
    
    with open(filepath, 'w') as f:
        f.write(content)

fix_file('panthora_be/tests/Domain.Specs/Application/Services/TourServiceTests.cs')

