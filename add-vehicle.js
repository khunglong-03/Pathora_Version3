// Add a Bus to logged-in transport provider's fleet.
// Usage: edit EMAIL/PASSWORD, then `node add-vehicle.js`.
const API = 'http://localhost:5182';
const AUTH_LOGIN = `${API}/api/auth/login`;
const VEHICLES = `${API}/transport-provider/vehicles`;
const EMAIL = 'thehieuxe@gmail.com';      // <-- transport provider account
const PASSWORD = 'thehieu03';                 // <-- password

const VehicleType = { Car: 1, Bus: 2, Coach: 5 };
const BAD_ID = '019dd53d-eed5-7d03-b936-d31d3bc5a7ae'; // first attempt with wrong enum, delete

async function main() {
  const login = await fetch(AUTH_LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const loginJson = await login.json();e đó
  const token = loginJson?.data?.accessToken ?? loginJson?.accessToken ?? loginJson?.token;
  if (!token) { console.error('Login failed:', loginJson); process.exit(1); }
  console.log('Login OK.');

  if (BAD_ID) {
    const del = await fetch(`${VEHICLES}/${BAD_ID}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Delete bad vehicle:', del.status);
  }

  const payload = {
    vehicleType: VehicleType.Bus,
    brand: 'Hyundai',
    model: 'Universe',
    seatCapacity: 45,
    quantity: 2,
    notes: 'Auto-added to unblock transport approval 2026-05-15',
  };

  const res = await fetch(VEHICLES, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  console.log('Create vehicle:', res.status, text);
}
main().catch(e => { console.error(e); process.exit(1); });
