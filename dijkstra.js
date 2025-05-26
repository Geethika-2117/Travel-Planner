// Simple static graph for simulation
// Simple static graph represented using an adjacency list (DSA: Graph - Adjacency List)
const graph = {
  'Mumbai': ['Pune', 'Surat'],
  'Pune': ['Indore'],
  'Surat': ['Udaipur'],
  'Indore': ['Delhi'],
  'Udaipur': ['Jaipur'],
  'Jaipur': ['Delhi'],
  'Delhi': []
};
// Map for descriptive path instructions (DSA: Hash Map for quick lookup)
const stepsMap = {
  'Pune': 'Take NH48 to Pune',
  'Surat': 'Head to Surat via coastal highway',
  'Udaipur': 'Enter Rajasthan at Udaipur',
  'Jaipur': 'Proceed to Jaipur via NH52',
  'Indore': 'Reach Indore using expressway',
  'Delhi': 'Arrive at destination'
};
// Function to simulate Dijkstra’s algorithm using BFS for unweighted graphs
function dijkstra(start, end) {
  // Set to keep track of visited nodes to avoid cycles (DSA: Set)
  let visited = new Set();
  // Queue for BFS traversal; each element is [currentNode, pathSoFar] (DSA: Queue)
  let queue = [[start, []]];
  // BFS Loop (DSA: Breadth-First Search)
  while (queue.length) {
    const [city, path] = queue.shift();  // Dequeue (FIFO)
    // Goal check: If destination is reached, return full path
    if (city === end) {
      return path.concat({ instruction: `Arrive at ${end}`, description: stepsMap[end] || '' });
    }
    // path.concat: method that combines multiple path components into a single, complete file path
    visited.add(city);// Mark current node as visited
    // Explore all adjacent (neighboring) cities (DSA: Graph Traversal)
    for (const neighbor of graph[city] || []) {
      // Add unvisited neighbors to the queue
      if (!visited.has(neighbor)) {
        queue.push([neighbor, path.concat({
          instruction: `Go to ${neighbor}`,
          description: stepsMap[neighbor] || 'Take highway route'
        })]);
      }
    }
  }
  // If path not found, return fallback (DSA: Search failure handling)
  return [{ instruction: 'Route Not Found', description: 'No available steps' }];
}

module.exports = dijkstra;
