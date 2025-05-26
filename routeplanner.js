document.addEventListener('DOMContentLoaded', function() {
  // Initialize the map centered on India with zoom level 5
  const map = L.map('map').setView([20.5937, 78.9629], 5);
  // Add OpenStreetMap tile layer to the map
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Variable to store the current route displayed on the map
  let routeLayer = null;

  // Dictionary of major Indian cities with their latitude and longitude coordinates
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

  // Get references to all form input elements
  const startingPointInput = document.getElementById('startingPoint');
  const destinationInput = document.getElementById('destination');
  const departureDateInput = document.getElementById('departureDate');
  const departureTimeInput = document.getElementById('departureTime');
  const transportTypeRadios = document.getElementsByName('transportType');
  const routePreferenceRadios = document.getElementsByName('routePreference');
  const avoidCheckboxes = document.getElementsByName('avoid');
  const waypointsContainer = document.getElementById('waypointsContainer');
  const addWaypointBtn = document.getElementById('addWaypointBtn');
  const planRouteBtn = document.getElementById('planRouteBtn');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  // Get references to route summary elements
  const routeDistanceEl = document.getElementById('routeDistance');
  const routeTimeEl = document.getElementById('routeTime');
  const routeCostEl = document.getElementById('routeCost');
  
  // -----------------------------
  // DSA Concept: Node for Linked List
  // Used to store each search history item as a node in the linked list
  class Node {
    constructor(data) {
      this.data = data;  // The actual search history data
      this.next = null;  // Reference to the next node
    }
  }
  
  // DSA Concept: Singly Linked List
  // Custom implementation of a linked list to maintain search history efficiently
  class LinkedList {
    constructor() {
      this.head = null;  // Points to the first node in the list
      this.size = 0;     // Tracks the number of nodes in the list
    }
    
    // DSA Operation: Prepend (insert at beginning)
    // Adds a new search entry to the beginning of the list for O(1) insertion
    prepend(data) {
      const newNode = new Node(data);
      newNode.next = this.head;  // New node points to current head
      this.head = newNode;       // New node becomes the head
      this.size++;
      
      // Limit history size to 10 (DSA concept: fixed-length list with deletion)
      // If list exceeds 10 items, remove the oldest entry (last node)
      if (this.size > 10) {
        let current = this.head;
        // Traverse to the second-to-last node
        while (current.next && current.next.next) {
          current = current.next;
        }
        current.next = null;  // Remove the last node
        this.size--;
      }
    }
    
    // DSA Operation: Convert Linked List to Array
    // Traverses the list and returns elements as an array for easy rendering
    toArray() {
      let array = [];
      let current = this.head;
      while (current) {
        array.push(current.data);
        current = current.next;
      }
      return array;
    }
    
    // DSA Operation: Clear List
    // Resets the entire linked list (useful when clearing history)
    clear() {
      this.head = null;
      this.size = 0;
    }
  }

  // Create a new linked list to store search history
  const searchHistory = new LinkedList();

  // Load search history from local storage
  function loadHistory() {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    // Add each history item to the linked list in reverse order to maintain original order
    history.reverse().forEach(item => searchHistory.prepend(item));
    renderHistory();
  }

  // Save search history to local storage
  function saveHistory() {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory.toArray()));
  }

  // Render the search history in the UI
  function renderHistory() {
    historyList.innerHTML = '';
    searchHistory.toArray().forEach((item, index) => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      historyItem.innerHTML = `
        <p>${item.startLocation} to ${item.endLocation}${item.waypoints.length ? ' via ' + item.waypoints.join(', ') : ''}</p>
        <button class="delete-history-item" data-index="${index}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="#FF5555"/>
          </svg>
        </button>
      `;
      // Add click event to reuse this history item
      historyItem.addEventListener('click', () => reuseHistoryItem(item));
      historyList.appendChild(historyItem);
    });

    // Add delete button event listeners
    document.querySelectorAll('.delete-history-item').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();  // Prevent triggering the parent click event
        const index = parseInt(button.dataset.index);
        removeHistoryItem(index);
      });
    });
  }

  // Populate the form with data from a history item
  function reuseHistoryItem(item) {
    // Set form values from history item
    startingPointInput.value = item.startLocation;
    destinationInput.value = item.endLocation;
    departureDateInput.value = item.departureDate;
    departureTimeInput.value = item.departureTime;

    // Set transport type radio buttons
    transportTypeRadios.forEach(radio => {
      radio.checked = radio.value === item.transportType;
    });
    transportationOptions.forEach(option => {
      option.classList.toggle('active', option.querySelector('input').value === item.transportType);
    });

    // Set route preference radio buttons
    routePreferenceRadios.forEach(radio => {
      radio.checked = radio.value === item.routePreference;
    });
    document.querySelectorAll('.option-cards input[name="routePreference"]').forEach(input => {
      const card = input.closest('.option-card');
      card.classList.toggle('active', input.value === item.routePreference);
    });

    // Set avoid checkboxes
    avoidCheckboxes.forEach(checkbox => {
      checkbox.checked = item.avoid.includes(checkbox.value);
    });
    document.querySelectorAll('.option-cards input[name="avoid"]').forEach(input => {
      const card = input.closest('.option-card');
      card.classList.toggle('active', item.avoid.includes(input.value));
    });

    // Recreate waypoints from history item
    waypointsContainer.innerHTML = '<label>Waypoints (Optional)</label>';
    item.waypoints.forEach(waypoint => {
      const waypointDiv = document.createElement('div');
      waypointDiv.className = 'waypoint';
      waypointDiv.innerHTML = `
        <input type="text" list="indianCities" placeholder="Add a stop along the way" value="${waypoint}">
        <div class="waypoint-controls">
          <button type="button" class="remove-waypoint">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="#FF5555"/>
            </svg>
          </button>
        </div>
      `;
      waypointsContainer.appendChild(waypointDiv);
      waypointDiv.querySelector('.remove-waypoint').addEventListener('click', () => {
        waypointDiv.remove();
      });
    });

    // Plan the route with the restored data
    planRoute();
  }
  
  // DSA Operation: Remove Node by Index
  // Traverses the linked list to remove a node at a specific index
  function removeHistoryItem(index) {
    let current = searchHistory.head;
    let prev = null;
    let i = 0;
    // Find the node at the specified index
    while (current && i < index) {
      prev = current;
      current = current.next;
      i++;
    }
    if (current) {
      // If node is found, remove it by updating references
      if (prev) {
        prev.next = current.next;  // Skip the current node
      } else {
        searchHistory.head = current.next;  // Remove head node
      }
      searchHistory.size--;
      saveHistory();
      renderHistory();
    }
  }

  // Clear all history items
  clearHistoryBtn.addEventListener('click', () => {
    searchHistory.clear();
    saveHistory();
    renderHistory();
  });

  // Load history when page loads
  loadHistory();

  // Add event listeners for main functionality buttons
  addWaypointBtn.addEventListener('click', addWaypoint);
  planRouteBtn.addEventListener('click', planRoute);

  // Create a new waypoint input field
  function addWaypoint() {
    const waypointDiv = document.createElement('div');
    waypointDiv.className = 'waypoint';
    waypointDiv.innerHTML = `
      <input type="text" list="indianCities" placeholder="Add a stop along the way">
      <div class="waypoint-controls">
        <button type="button" class="remove-waypoint">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="#FF5555"/>
          </svg>
        </button>
      </div>
    `;
    waypointsContainer.appendChild(waypointDiv);
    waypointDiv.querySelector('.remove-waypoint').addEventListener('click', () => {
      waypointDiv.remove();
    });
  }

  // Main function to plan and display a route
  async function planRoute() {
    // Collect all form inputs
    const startLocation = startingPointInput.value.trim();
    const endLocation = destinationInput.value.trim();
    const departureDate = departureDateInput.value;
    const departureTime = departureTimeInput.value;
    // Get waypoints that have valid city names
    const waypoints = Array.from(waypointsContainer.querySelectorAll('input'))
      .map(input => input.value.trim())
      .filter(val => val && cityCoords[val]);
    
    // Get selected transport type
    let transportType = 'car';
    for (const radio of transportTypeRadios) {
      if (radio.checked) {
        transportType = radio.value;
        break;
      }
    }

    // Get selected route preference
    let routePreference = 'fastest';
    for (const radio of routePreferenceRadios) {
      if (radio.checked) {
        routePreference = radio.value;
        break;
      }
    }

    // Get selected avoid options
    const avoidOptions = Array.from(avoidCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    // Validate inputs
    if (!startLocation || !endLocation || !cityCoords[startLocation] || !cityCoords[endLocation]) {
      alert('Please select valid starting point and destination from the list.');
      return;
    }

    // Validate date and time inputs
    if (!validateDateAndTime()) {
      return;
    }

    // Update UI to show route planning in progress
    planRouteBtn.textContent = 'Planning Route...';
    planRouteBtn.disabled = true;

    try {
      // Send API request to backend server
      const response = await fetch('http://localhost:3000/api/calculate-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startLocation,
          endLocation,
          transportType,
          departureDate,
          departureTime,
          waypoints,
          routePreference,
          avoid: avoidOptions
        })
      });

      const data = await response.json();
      // Reset button state
      planRouteBtn.textContent = 'Plan My Route';
      planRouteBtn.disabled = false;

      if (response.ok && data.route && data.route.distanceKm && data.steps) {
        // Update route summary with API response data
        updateRouteSummary(data);
        
        // Update map with route visualization
        if (routeLayer) map.removeLayer(routeLayer);
        if (data.route.coordinates && data.route.coordinates.length) {
          // Create a polyline with the route coordinates
          routeLayer = L.polyline(data.route.coordinates, { color: '#00B2B2' }).addTo(map);
          map.fitBounds(routeLayer.getBounds());
        } else {
          // Fallback: create a simple polyline between cities
          const coords = [cityCoords[startLocation], ...waypoints.map(w => cityCoords[w]), cityCoords[endLocation]];
          routeLayer = L.polyline(coords, { color: '#00B2B2' }).addTo(map);
          map.fitBounds(routeLayer.getBounds());
        }

        // Add this search to history
        searchHistory.prepend({
          startLocation,
          endLocation,
          waypoints,
          transportType,
          departureDate,
          departureTime,
          routePreference,
          avoid: avoidOptions
        });
        saveHistory();
        renderHistory();
      } else {
        throw new Error(data.error || 'Invalid route data from server');
      }
    } catch (error) {
      // Handle API errors with mock data for demonstration
      console.error('Error planning route:', error);
      alert('Failed to plan route. Using mock data for demonstration.');
      
      // Create mock route data for demonstration
      const mockData = {
        route: {
          distanceKm: 1423,
          coordinates: [
            cityCoords[startLocation],
            ...waypoints.map(w => cityCoords[w]),
            cityCoords[endLocation]
          ]
        },
        travelTime: '21h 30m',
        cost: 4500,
        steps: [
          { instruction: `Start from ${startLocation}`, description: 'Head north' },
          ...waypoints.map(w => ({ instruction: `Stop at ${w}`, description: 'Continue on route' })),
          { instruction: `Arrive at ${endLocation}`, description: 'Destination reached' }
        ]
      };
      
      // Update UI with mock data
      updateRouteSummary(mockData);
      if (routeLayer) map.removeLayer(routeLayer);
      routeLayer = L.polyline(mockData.route.coordinates, { color: '#00B2B2' }).addTo(map);
      map.fitBounds(routeLayer.getBounds());

      // Add to history even with mock data
      searchHistory.prepend({
        startLocation,
        endLocation,
        waypoints,
        transportType,
        departureDate,
        departureTime,
        routePreference,
        avoid: avoidOptions
      });
      saveHistory();
      renderHistory();

      // Reset button state
      planRouteBtn.textContent = 'Plan My Route';
      planRouteBtn.disabled = false;
    }
  }

  // Update the route summary section with distance, time and cost
  function updateRouteSummary(data) {
    routeDistanceEl.textContent = `${data.route.distanceKm} km`;
    routeTimeEl.textContent = data.travelTime;
    routeCostEl.textContent = `₹${data.cost}`;
  }

  // Set up UI interaction for transportation options
  const transportationOptions = document.querySelectorAll('.transportation-option');
  transportationOptions.forEach(option => {
    option.addEventListener('click', function() {
      // Toggle active class for visual feedback
      transportationOptions.forEach(o => o.classList.remove('active'));
      this.classList.add('active');
      // Update the radio button state
      const radio = this.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  // Set up UI interaction for route preference options
  document.querySelectorAll('.option-cards input[name="routePreference"]').forEach(input => {
    const card = input.closest('.option-card');
    card.addEventListener('click', function() {
      // Toggle active class for visual feedback
      const cards = card.closest('.option-cards').querySelectorAll('.option-card');
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      // Update the radio button state
      input.checked = true;
    });
  });

  // Set up UI interaction for avoid options
  document.querySelectorAll('.option-cards input[name="avoid"]').forEach(input => {
    const card = input.closest('.option-card');
    card.addEventListener('click', function() {
      // Toggle active class and checkbox state
      card.classList.toggle('active');
      input.checked = !input.checked;
    });
  });

  // Validate date and time inputs
  function validateDateAndTime() {
    let isValid = true;
    departureDateInput.style.borderColor = '';
    departureTimeInput.style.borderColor = '';
    const dateErrorMsg = departureDateInput.nextElementSibling;
    const timeErrorMsg = departureTimeInput.nextElementSibling;
    dateErrorMsg.style.display = 'none';
    timeErrorMsg.style.display = 'none';

    if (departureDateInput.value) {
      const selectedDate = new Date(departureDateInput.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if date is in the past
      if (selectedDate < today) {
        departureDateInput.style.borderColor = '#ff3333';
        dateErrorMsg.textContent = 'Please select today or a future date';
        dateErrorMsg.style.display = 'block';
        isValid = false;
      }

      // If today is selected, verify time is in the future
      if (selectedDate.toDateString() === today.toDateString() && departureTimeInput.value) {
        const selectedTime = departureTimeInput.value.split(':');
        const now = new Date();

        if (parseInt(selectedTime[0]) < now.getHours() || 
            (parseInt(selectedTime[0]) === now.getHours() && parseInt(selectedTime[1]) < now.getMinutes())) {
          departureTimeInput.style.borderColor = '#ff3333';
          timeErrorMsg.textContent = 'Please select a future time';
          timeErrorMsg.style.display = 'block';
          isValid = false;
        }
      }

      // Ensure time is provided if date is selected
      if (!departureTimeInput.value) {
        departureTimeInput.style.borderColor = '#ff3333';
        timeErrorMsg.textContent = 'Please select a departure time';
        timeErrorMsg.style.display = 'block';
        isValid = false;
      }
    }

    // Ensure date is provided if time is selected
    if (departureTimeInput.value && !departureDateInput.value) {
      departureDateInput.style.borderColor = '#ff3333';
      dateErrorMsg.textContent = 'Please select a departure date';
      dateErrorMsg.style.display = 'block';
      isValid = false;
    }

    return isValid;
  }

  // Set up date and time validation
  setupDateTimeValidation();
});

// Initialize date and time validation UI and event handlers
function setupDateTimeValidation() {
  const departureDateInput = document.getElementById('departureDate');
  const departureTimeInput = document.getElementById('departureTime');
  const planRouteBtn = document.getElementById('planRouteBtn');
  
  // Create error message elements for date and time inputs
  const dateErrorMsg = document.createElement('div');
  dateErrorMsg.className = 'error-message';
  dateErrorMsg.style.color = '#ff3333';
  dateErrorMsg.style.fontSize = '12px';
  dateErrorMsg.style.marginTop = '5px';
  dateErrorMsg.style.display = 'none';
  
  const timeErrorMsg = document.createElement('div');
  timeErrorMsg.className = 'error-message';
  timeErrorMsg.style.color = '#ff3333';
  timeErrorMsg.style.fontSize = '12px';
  timeErrorMsg.style.marginTop = '5px';
  timeErrorMsg.style.display = 'none';
  
  // Insert error messages after date and time inputs
  departureDateInput.parentNode.insertBefore(dateErrorMsg, departureDateInput.nextSibling);
  departureTimeInput.parentNode.insertBefore(timeErrorMsg, departureTimeInput.nextSibling);
  
  // Add event listeners for real-time validation feedback
  departureDateInput.addEventListener('change', function() {
    validateDateAndTime();
  });
  
  departureTimeInput.addEventListener('change', function() {
    validateDateAndTime();
  });
  
  // Override the plan route button to validate before processing
  const originalPlanRouteFunction = planRouteBtn.onclick;
  planRouteBtn.onclick = function(e) {
    if (!validateDateAndTime()) {
      e.preventDefault();
      return false;
    }
    return originalPlanRouteFunction ? originalPlanRouteFunction.call(this, e) : true;
  };
}