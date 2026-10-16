const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Test DB Connection on startup
require('./config/db');
const { seedMateriaPrima } = require('./utils/seed');
const materiaPrimaRoutes = require('./routes/materiaPrima.routes');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API funcionando correctamente conectada a Finanzas_BD' });
});

app.use('/api/materia-prima', materiaPrimaRoutes);

// Start Server & Seed Initial Data
app.listen(port, async () => {
  console.log(`Servidor Backend corriendo en http://localhost:${port}`);
  await seedMateriaPrima();
});
