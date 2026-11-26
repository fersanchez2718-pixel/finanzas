import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

// Obtener dinámicamente la IP de la máquina host desde Expo
const getHostIp = (): string => {
  // En Android Emulator (no es dispositivo físico) la IP del host es siempre 10.0.2.2
  if (Platform.OS === 'android' && !Device.isDevice) {
    return '10.0.2.2';
  }

  // Si corre a través de Expo Go en un dispositivo físico, obtener la IP de la PC host
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }

  // Respaldo estático a la IP local actual de la PC
  return '10.0.10.34';
};

const HOST = getHostIp();

export const API_BASE_URL = Platform.select({
  android: `http://${HOST}:3000/api`,
  ios: Device.isDevice ? `http://${HOST}:3000/api` : 'http://localhost:3000/api',
  default: 'http://localhost:3000/api',
});

console.log(`[API Config] Conectando a: ${API_BASE_URL} (Dispositivo físico: ${Device.isDevice})`);

export const ENDPOINTS = {
  health: `${API_BASE_URL}/health`,
  dashboard: `${API_BASE_URL}/dashboard/balance`,
  materiaPrima: `${API_BASE_URL}/materia-prima`,
  inventario: `${API_BASE_URL}/inventario`,
  compras: `${API_BASE_URL}/compras`,
  ventas: `${API_BASE_URL}/ventas`,
  ventasReporte: `${API_BASE_URL}/ventas/reporte`,
  productos: `${API_BASE_URL}/productos`,
  mermas: `${API_BASE_URL}/mermas`,
  gastosOperativos: `${API_BASE_URL}/gastos-operativos`,
  nomina: `${API_BASE_URL}/nomina`,
  proveedores: `${API_BASE_URL}/proveedores`,
  usuarios: `${API_BASE_URL}/usuarios`,
};

