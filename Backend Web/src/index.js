const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Test DB Connection on startup
require('./config/db');

// Middleware
app.use(cors());
app.use(express.json());

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API funcionando correctamente conectada a Finanzas_BD' });
});

// Start Server
app.listen(port, () => {
  console.log(`Servidor Backend corriendo en http://localhost:${port}`);
});
