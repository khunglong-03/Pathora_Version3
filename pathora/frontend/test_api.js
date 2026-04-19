const axios = require('axios');
async function run() {
  try {
    await axios.put('http://localhost:5182/api/tour', 'id=019da298-e298-74de-8fe8-0f7bcaa0162f&status=0&tourName=Test&shortDescription=Test&longDescription=Test', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  } catch (err) {
    console.log(JSON.stringify(err.response.data, null, 2));
  }
}
run();
