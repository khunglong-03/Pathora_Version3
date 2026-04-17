const fs = require('fs');

const files = [
  'd:\\\\Doan2\\\\pathora\\\\frontend\\\\src\\\\features\\\\visa\\\\components\\\\VisaApplicationPage.tsx',
  'd:\\\\Doan2\\\\pathora\\\\frontend\\\\src\\\\features\\\\user\\\\profile\\\\ProfilePage.tsx',
  'd:\\\\Doan2\\\\pathora\\\\frontend\\\\src\\\\features\\\\tours\\\\components\\\\TourDetailPage.tsx',
  'd:\\\\Doan2\\\\pathora\\\\frontend\\\\src\\\\features\\\\policies\\\\components\\\\PolicyPage.tsx',
  'd:\\\\Doan2\\\\pathora\\\\frontend\\\\src\\\\features\\\\custom-tour\\\\components\\\\CustomTourPage.tsx',
  'd:\\\\Doan2\\\\pathora\\\\frontend\\\\src\\\\features\\\\checkout\\\\components\\\\CheckoutPage.tsx',
  'd:\\\\Doan2\\\\pathora\\\\frontend\\\\src\\\\features\\\\bookings\\\\components\\\\BookingDetailPage.tsx',
  'd:\\\\Doan2\\\\pathora\\\\frontend\\\\src\\\\features\\\\bookings\\\\components\\\\BookingHistoryPage.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/import\s*\{\s*Landing(?:Header|Footer)\s*\}\s*from\s*\"(.*?)Landing(?:Header|Footer)\";\n?/g, '');
  content = content.replace(/<\/?LandingHeader[^>]*>\n?/g, '');
  content = content.replace(/<\/?LandingFooter[^>]*>\n?/g, '');
  fs.writeFileSync(f, content, 'utf8');
});
console.log("Done");
