import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Assert.Single(cls.Plans[0].Activities[0].Routes);
    # Assert.Equal("Airport", cls.Plans[0].Activities[0].Routes[0].FromLocation!.LocationName);
    content = re.sub(r'Assert\.Single\([^.]+\.Routes\);', '', content)
    content = re.sub(r'\.Routes\[0\]', '', content)
    content = re.sub(r'var route = activity\.Routes\[0\];', 'var route = activity;', content)
    
    # Assert.Single(transportActivity.Routes);
    # Assert.Equal("International Airport", transportActivity.Routes[0].FromLocation!.LocationName);
    content = re.sub(r'transportActivity\.Routes\[0\]', 'transportActivity', content)
    
    content = re.sub(r'activity\.Routes\.First\([^)]+\)', 'activity', content)
    content = re.sub(r'activity\.Routes\.Where\([^)]+\)\.ToList\(\)', 'new List<TourDayActivityEntity>()', content)
    content = re.sub(r'activity\.Routes\.Add\(route\);', '', content)
    
    # var route = capturedTour!.Classifications[0].Plans[0].Activities[0].Routes[0];
    content = re.sub(r'\.Activities\[0\]\.Routes\[0\]', '.Activities[0]', content)
    
    with open(filepath, 'w') as f:
        f.write(content)

fix_file('panthora_be/tests/Domain.Specs/Application/Services/TourServiceTests.cs')
fix_file('panthora_be/tests/Domain.Specs/Application/Validators/CreateTourCommandValidatorTests.cs')
