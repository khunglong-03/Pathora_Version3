const https = require('https');
https.get('https://res.cloudinary.com/dwa0kngte/image/upload/v1777395129/panthora/b231b3b4-4f4e-4e65-becd-a6b501ae4076.jpeg.jpg', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
});
