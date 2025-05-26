const startLocationInput = document.getElementById('startLocation');
const endLocationInput = document.getElementById('endLocation');
const departureDateInput = document.getElementById('departureDate');
const departureTimeInput = document.getElementById('departureTime');
const transportTypeRadios = document.getElementsByName('transportType');
const findRouteBtn = document.getElementById('findRouteBtn');
const resultsSection = document.getElementById('resultsSection');

// Set minimum date to today
function setMinimumDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  
  departureDateInput.setAttribute('min', formattedDate);
  
  if (!departureDateInput.value) {
    departureDateInput.value = formattedDate;
  }
}

setMinimumDate();
// --- CITY COORDINATES DICTIONARY ---
// DSA Concept: Hash Map (used for constant time city lookup based on name)
const cityCoords = {
  'Mumbai': [19.0760, 72.8777],
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
// --- INITIALIZE MAP ---
let map = L.map('map').setView([20.5937, 78.9629], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
let routeLayer = null;

findRouteBtn.addEventListener('click', findBestRoute);
// --- VALIDATION FUNCTION ---
// DSA Concept: Control structures for validating user input with conditional checks (if-else)
function validateDateAndTime() {
  const startLocation = startLocationInput.value.trim();
  const endLocation = endLocationInput.value.trim();
  const departureDate = departureDateInput.value;
  const departureTime = departureTimeInput.value;
  
  if (!startLocation || !endLocation) {
    alert('Please enter both starting point and destination.');
    return false;
  }
  
  if (!cityCoords[startLocation] || !cityCoords[endLocation]) {
    alert('Please select valid cities from the list.');
    return false;
  }
  
  if (!departureDate) {
    alert('Please select a departure date.');
    return false;
  }
  
  const selectedDate = new Date(departureDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    alert('Departure date cannot be in the past.');
    return false;
  }
  
  if (!departureTime) {
    alert('Please select a departure time.');
    return false;
  }
  // DSA Concept: Time comparison logic - using algorithmic logic to validate timestamps
  if (selectedDate.toDateString() === today.toDateString()) {
    const selectedTime = departureTime.split(':');
    const now = new Date();
    
    if (parseInt(selectedTime[0]) < now.getHours() || 
        (parseInt(selectedTime[0]) === now.getHours() && parseInt(selectedTime[1]) < now.getMinutes())) {
      alert('For today\'s travel, departure time cannot be in the past.');
      return false;
    }
  }
  
  return true;
}
// --- FIND BEST ROUTE FUNCTION ---
// DSA Concept: Using Graph-based API on server to perform pathfinding algorithm (e.g., Dijkstra’s Algorithm)
async function findBestRoute() {
  const startLocation = startLocationInput.value.trim();
  const endLocation = endLocationInput.value.trim();
  const departureDate = departureDateInput.value;
  const departureTime = departureTimeInput.value;
  let selectedTransportType = 'car';
  // DSA Concept: Iterating over list of radio buttons using loop (Linear Search to get selected transport)
  for (const radio of transportTypeRadios) {
    if (radio.checked) {
      selectedTransportType = radio.value;
      break;
    }
  }

  if (!validateDateAndTime()) {
    return;
  }

  findRouteBtn.textContent = 'Finding Route...';
  findRouteBtn.disabled = true;

  try {
    const response = await fetch('http://localhost:3000/api/calculate-route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startLocation,
        endLocation,
        transportType: selectedTransportType,
        departureDate,
        departureTime,
        waypoints: [],
        routePreference: 'fastest'
      })
    });

    const data = await response.json();
    findRouteBtn.textContent = 'Find Best Route';
    findRouteBtn.disabled = false;

    if (response.ok && data.route && data.route.distanceKm && data.steps) {
      // DSA Concept: Pathfinding result used here from server-side Graph traversal (e.g., Dijkstra/Shortest Path)
      updateRouteDisplay(startLocation, endLocation, departureDate, departureTime, selectedTransportType, {
        distance: data.route.distanceKm,
        time: data.travelTime,
        cost: data.cost,
        steps: data.steps,
        arrivalTime: data.arrivalTime || 'Unknown',
        coordinates: data.route.coordinates
      });

      if (routeLayer) map.removeLayer(routeLayer);
      if (data.route.coordinates && data.route.coordinates.length) {
        // DSA Concept: Drawing path as a polyline over map using the coordinates array
        routeLayer = L.polyline(data.route.coordinates, { color: '#00B2B2' }).addTo(map);
        map.fitBounds(routeLayer.getBounds());
      } else {
        routeLayer = L.polyline([cityCoords[startLocation], cityCoords[endLocation]], { color: '#00B2B2' }).addTo(map);
        map.fitBounds(routeLayer.getBounds());
      }

      resultsSection.style.display = 'block';
      resultsSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      throw new Error(data.error || 'Invalid route data from server');
    }
  } catch (error) {
    console.error('Error finding route:', error);
    alert('Failed to find route. Using mock data for demonstration.');
    // DSA Concept: Using fallback mock data (static array of coordinates and steps)
    const mockData = {
      distance: 1423,
      time: '21h 30m',
      cost: 4500,
      arrivalTime: '6:30 AM (Next day)',
      steps: [
        { instruction: `Start from ${startLocation}`, description: 'Head north on highway' },
        { instruction: `Arrive at ${endLocation}`, description: 'Destination reached' }
      ],
      coordinates: [
        cityCoords[startLocation],
        [(cityCoords[startLocation][0] + cityCoords[endLocation][0]) / 2, (cityCoords[startLocation][1] + cityCoords[endLocation][1]) / 2],
        cityCoords[endLocation]
      ]
    };
    
    updateRouteDisplay(startLocation, endLocation, departureDate, departureTime, selectedTransportType, mockData);

    if (routeLayer) map.removeLayer(routeLayer);
    routeLayer = L.polyline(mockData.coordinates, { color: '#00B2B2' }).addTo(map);
    map.fitBounds(routeLayer.getBounds());

    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
    findRouteBtn.textContent = 'Find Best Route';
    findRouteBtn.disabled = false;
  }
}
  // --- DISPLAY FUNCTION FOR ROUTE DETAILS ---
// DSA Concept: Loop through steps array to dynamically create UI (Iteration over linear structure)
function updateRouteDisplay(start, end, date, time, transportType, routeData) {
  const departureDate = new Date(date + 'T' + time);
  const formattedDate = departureDate.toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' });
  const formattedTime = departureDate.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

  document.getElementById('routeSummaryTitle').textContent = `${start} to ${end}`;
  document.getElementById('routeSummaryTransportType').textContent = `By ${transportType.charAt(0).toUpperCase() + transportType.slice(1)} • Fastest Route`;
  document.getElementById('routeSummaryDate').textContent = `${formattedDate} • ${formattedTime}`;
  document.getElementById('routeCost').textContent = `₹${routeData.cost}`;
  document.getElementById('routeDistance').textContent = `${routeData.distance} km`;
  document.getElementById('routeTime').textContent = routeData.time;
  document.getElementById('routeArrival').textContent = routeData.arrivalTime;

  const routeStepsContainer = document.getElementById('routeSteps');
  routeStepsContainer.innerHTML = '<h3>Journey Steps</h3>';
   // DSA Concept: Iterating over list (array) of journey steps to create structured route step-by-step
  routeData.steps.forEach((step, index) => {
    const stepElement = document.createElement('div');
    stepElement.className = 'route-step';
    stepElement.innerHTML = `
      <div class="route-step-icon">${index + 1}</div>
      <div class="route-step-details">
        <h4>${step.instruction}</h4>
        <p>${step.description}</p>
      </div>
    `;
    routeStepsContainer.appendChild(stepElement);
  });
}