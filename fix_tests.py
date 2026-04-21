import re
import os

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Regex to match:
    # Routes: [
    #     new RouteDto(...)
    # ]
    # or Routes: []
    # or Routes: null
    
    # Let's replace Routes: \[.*?\] with TransportationType: "Bus", TransportationName: "Local Bus"
    # using re.DOTALL
    
    content = re.sub(r'Routes:\s*\[\s*new\s+RouteDto\s*\([\s\S]*?\)\s*\]', 'TransportationType: "Bus"', content)
    content = re.sub(r'Routes:\s*\[\s*\]', 'TransportationType: null', content)
    content = re.sub(r'Routes:\s*null', 'TransportationType: null', content)
    
    # Also fix: var route = activity.Routes.First();
    content = re.sub(r'var route = activity\.Routes\.First\(\);', '', content)
    content = re.sub(r'route\.TransportationName', 'activity.TransportationName', content)
    content = re.sub(r'route\.TransportationType\.ToString\(\)', 'activity.TransportationType.ToString()', content)
    
    # Also in TourServiceTests.cs line 2616:
    # assert.Equal("Bus", route.TransportationType.ToString());
    # Let's just fix activity.Routes.First() to something else.
    # Actually, we can just replace activity.Routes.First() with activity or activity.TransportationType
    
    with open(filepath, 'w') as f:
        f.write(content)

fix_file('panthora_be/tests/Domain.Specs/Application/Services/TourServiceTests.cs')
fix_file('panthora_be/tests/Domain.Specs/Application/Services/TourActivityResourceLinkTests.cs')

