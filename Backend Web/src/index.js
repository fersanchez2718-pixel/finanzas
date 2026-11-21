const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Test DB Connection on startup
require('./config/db');
const { seedMateriaPrima } = require('./utils/seed');
const { optionalAuth } = require('./middleware/auth.middleware');

const authRoutes = require('./routes/auth.routes');
const materiaPrimaRoutes = require('./routes/materiaPrima.routes');
const inventarioRoutes = require('./routes/inventario.routes');
const comprasRoutes = require('./routes/compras.routes');
const productosRoutes = require('./routes/productos.routes');
const ventasRoutes = require('./routes/ventas.routes');
const mermasRoutes = require('./routes/mermas.routes');
const gastosOperativosRoutes = require('./routes/gastosOperativos.routes');
const nominaRoutes = require('./routes/nomina.routes');
const proveedoresRoutes = require('./routes/proveedores.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API funcionando correctamente conectada a Finanzas_BD' });
});

// Rutas de autenticación y perfil de usuario
app.use('/api/auth', authRoutes);

// Middleware multi-tenant para aislar datos por usuario
app.use('/api', optionalAuth);

app.use('/api/materia-prima', materiaPrimaRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/mermas', mermasRoutes);
app.use('/api/gastos-operativos', gastosOperativosRoutes);
app.use('/api/nomina', nominaRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Start Server & Seed Initial Data
app.listen(port, async () => {
  console.log(`Servidor Backend corriendo en http://localhost:${port}`);
  await seedMateriaPrima();
});
