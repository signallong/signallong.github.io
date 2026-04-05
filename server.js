const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// Binance API endpoint
const BINANCE_API_URL = 'https://api.binance.com/api/v3/ticker/price';

// Route to fetch Binance data
app.get('/binance-data', async (req, res) => {
    try {
        const response = await axios.get(BINANCE_API_URL);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching data from Binance', error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
