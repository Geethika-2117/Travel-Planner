const express = require('express'); // imports express libraries
const app = express();
const routeHandler = require('./routes/route'); // imports route.js
const path = require('path'); // imports node.js path
const cors = require('cors'); // imports CORS - allows server to accept requests

app.use(express.json());
app.use(cors());

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve homepage on root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'homepage.html'));
});

// API route for route calculation
app.use('/api/calculate-route', routeHandler);

const PORT = 3000; // defines the port number
app.listen(PORT, () => {
  console.log(`TripMate backend running at http://localhost:${PORT}`); // starts the server on defined port
});