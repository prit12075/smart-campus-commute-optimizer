const express = require('express');
const cors = require('cors');

// Create the Express application
const app = express();
const PORT = 3000; // Standard port for development

// Middleware
app.use(cors()); // Allows frontend to communicate with this server
app.use(express.json()); // Allows the server to parse JSON bodies

// ----------------------------------------------------
// 1. Initial Test Route (To check if the server is running)
// ----------------------------------------------------
app.get('/', (req, res) => {
    res.send('Commute Optimizer Backend is running successfully!');
});

// ----------------------------------------------------
// 2. Commute Matching API Route (Will be expanded later)
// ----------------------------------------------------
const { findOptimalMatches } = require('./matcher'); 
// The actual DSA logic will be imported from matcher.js

app.post('/api/match', (req, res) => {
    // This is where you'll eventually receive the list of current requests.
    const activeRequests = req.body.requests; 

    // For now, return a placeholder response
    // const matches = findOptimalMatches(activeRequests);
    res.status(200).json({ 
        message: 'Request received. Matching logic (DSA) will be run here.',
        // matches: matches 
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Test URL: http://localhost:${PORT}`);
});