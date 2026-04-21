import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Regex to match Routes: [ new RouteDto(...) ] in tests
    content = re.sub(r'Routes:\s*\[\s*new\s+RouteDto\s*\([\s\S]*?\)\s*\]', 'TransportationType: "Bus"', content)
    content = re.sub(r'Routes:\s*\[\s*\]', 'TransportationType: null', content)
    content = re.sub(r'Routes:\s*null', 'TransportationType: null', content)
    
    # Fix TourPlanRouteEntity reference
    content = re.sub(r'TourPlanRouteEntity\.Create\(', 'TourDayActivityEntity.Create(', content)
    content = re.sub(r'var route = activity\.Routes\.First\(\);', '', content)
    content = re.sub(r'Assert\.Equal\("Bus", route\.TransportationType\.ToString\(\)\);', 'Assert.Equal("Bus", activity.TransportationType.ToString());', content)
    content = re.sub(r'Assert\.Equal\("Bus", route\.TransportationName\);', 'Assert.Equal("Bus", activity.TransportationName);', content)
    content = re.sub(r'route\.', 'activity.', content)

    # Some remaining route. in TourServiceTests.cs
    content = re.sub(r'activity\.TransportationName', 'activity.TransportationName', content)

    with open(filepath, 'w') as f:
        f.write(content)

fix_file('panthora_be/tests/Domain.Specs/Application/Validators/CreateTourCommandValidatorTests.cs')
fix_file('panthora_be/tests/Domain.Specs/Application/Services/TourServiceTests.cs')

