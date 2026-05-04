const axios = require('axios');
(async () => {
  try {
    const res = await axios.get('http://localhost:5182/api/public/bookings/03d6dcb5-5593-455b-b9f7-66c3c6fddfb6');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
})();
