const express = require('express');
const router = express.Router();
// HashMap (object) for constant-time lookup of city coordinates (DSA: Hash Table)
const cityCoords = {
  'Mumbai': [19.0760, 72.8777], // city: [latitude, longitude]
  'Delhi': [28.7041, 77.1025],
  'Bangalore': [12.9716, 77.5946],
  'Hyderabad': [17.3850, 78.4867],
  'Chennai': [13.0827, 80.2707],
  'Kolkata': [22.5726, 88.3639],
  'Pune': [18.5204, 73.8567],
  'Jaipur': [26.9124, 75.7873],
  'Ahmedabad': [23.0225, 72.5714],
  'Lucknow': [26.8467, 80.9462],
  'Kochi': [9.9312, 76.2673],
  'Chandigarh': [30.7333, 76.7794],
  'Goa': [15.2993, 74.1240],
  'Varanasi': [25.3176, 82.9739],
  'Amritsar': [31.6340, 74.8723],
  'Agra': [27.1767, 78.0081],
  'Shimla': [31.1048, 77.1734],
  'Udaipur': [24.5854, 73.7125],
  'Darjeeling': [27.0360, 88.2627],
  'Rishikesh': [30.0869, 78.2676]
};
// Another HashMap for transport configuration (DSA: Hash Table)
const transportConfigs = {
  car: { speed: 60, costPerKm: 8 },
  bus: { speed: 45, costPerKm: 3 },
  train: { speed: 80, costPerKm: 2 },
  flight: { speed: 500, costPerKm: 5 }
};
// Function to calculate approximate distance using Euclidean formula (DSA: Geometry)
function calculateDistance(from, to) {
  const [lat1, lon1] = cityCoords[from];
  const [lat2, lon2] = cityCoords[to];
  const dx = lat2 - lat1;
  const dy = lon2 - lon1;
  return Math.sqrt(dx * dx + dy * dy) * 111; // 111 ~ km/degree
}
// Convert time in decimal hours to formatted string (simple utility)
function formatTime(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}
// Greedy approach to find top 2 midpoints with least detour (DSA: Greedy + Sorting)
function insertMidPoints(start, end) {
  const midCandidates = Object.keys(cityCoords).filter(
    city => city !== start && city !== end
  );
  // Create array of objects with total detour distance
  const midPoints = midCandidates
    .map(city => {
      const distFromStart = calculateDistance(start, city);
      const distToEnd = calculateDistance(city, end);
      const totalDetour = distFromStart + distToEnd;
      return { city, totalDetour };
    })
    .sort((a, b) => a.totalDetour - b.totalDetour) // Sort by minimum detour
    .slice(0, 2) // Top 2 midpoints
    .map(obj => obj.city);

  return midPoints;
}

router.post('/', (req, res) => {
  let { startLocation, endLocation, transportType, waypoints = [], avoid = [] } = req.body;

  if (!cityCoords[startLocation] || !cityCoords[endLocation]) {
    return res.status(400).json({ error: 'Invalid start or end location' });
  }
   // Generate midpoints if none are provided (Algorithm: Heuristic-based midpoint insertion)
  // If no waypoints, generate fake midpoints
  if (!waypoints || waypoints.length === 0) {
    waypoints = insertMidPoints(startLocation, endLocation);
  }

  const config = transportConfigs[transportType] || transportConfigs.car;
  const fullRoute = [startLocation, ...waypoints, endLocation];

  let totalDistance = 0;
  const coordinates = [];
  // Iterate through fullRoute to calculate total distance (DSA: Array traversal)
  for (let i = 0; i < fullRoute.length - 1; i++) {
    const from = fullRoute[i];
    const to = fullRoute[i + 1];
    if (!cityCoords[from] || !cityCoords[to]) continue;
    totalDistance += calculateDistance(from, to);
    coordinates.push(cityCoords[from]); // Store coordinates in list
  }
  coordinates.push(cityCoords[endLocation]);
  // Simple conditional check to alter distance (DSA: Decision logic)
  if (avoid.includes('tolls') || avoid.includes('highways')) {
    totalDistance *= 1.1;
  }

  const durationHours = totalDistance / config.speed;
  const cost = Math.round(totalDistance * config.costPerKm);
 // Construct route steps using Map-like logic (DSA: Iteration + Decision Tree)
  const steps = fullRoute.map((city, i) => {
    if (i === 0) {
      return {
        instruction: `🚦 Start from ${city}`,
        description: `Begin your journey from ${city} using ${transportType}`
      };
    } else if (i === fullRoute.length - 1) {
      return {
        instruction: `🛬 Arrive at ${city}`,
        description: `Reach your destination: ${city}`
      };
    } else {
      return {
        instruction: `🏙️ Stop at ${city}`,
        description: `Take a break or explore ${city} briefly`
      };
    }
  });

  const arrivalTime = new Date();
  arrivalTime.setHours(arrivalTime.getHours() + durationHours);
  // Return the final result (DSA: Object construction and response handling)
  res.json({
    route: {
      distanceKm: Math.round(totalDistance),
      coordinates,
    },
    travelTime: formatTime(durationHours),
    cost,
    steps,
    arrivalTime: arrivalTime.toLocaleTimeString()
  });
});

module.exports = router;
