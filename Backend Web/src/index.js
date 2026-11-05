const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Test DB Connection on startup
require('./config/db');
const { seedMateriaPrima } = require('./utils/seed');
const materiaPrimaRoutes = require('./routes/materiaPrima.routes');
const inventarioRoutes = require('./routes/inventario.routes');
const comprasRoutes = require('./routes/compras.routes');
const productosRoutes = require('./routes/productos.routes');
const ventasRoutes = require('./routes/ventas.routes');
const mermasRoutes = require('./routes/mermas.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API funcionando correctamente conectada a Finanzas_BD' });
});

app.use('/api/materia-prima', materiaPrimaRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/mermas', mermasRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Start Server & Seed Initial Data
app.listen(port, async () => {
  console.log(`Servidor Backend corriendo en http://localhost:${port}`);
  await seedMateriaPrima();
});
