import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { ENDPOINTS } from '../config/api';

const API_DASHBOARD = ENDPOINTS.dashboard;

export default function DashboardView() {
  const hoy = new Date().toISOString().split('T')[0];
  const [dia, setDia] = useState(hoy);
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState<'ingresos' | 'gastos'>('ingresos');
  const [loading, setLoading] = useState(true);
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [kpis, setKpis] = useState({
    totalIngresos: 0,
    totalGastos: 0,
    utilidadNeta: 0,
    margen: '0'
  });

  const [toast, setToast] = useState<{ mensaje: string; tipo: 'success' | 'error' } | null>(null);

  const showToast = (mensaje: string, tipo: 'success' | 'error' = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  const cargarBalance = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_DASHBOARD);
      const data = await res.json();
      if (data.success && data.transacciones) {
        setTransacciones(data.transacciones);
        if (data.kpis) setKpis(data.kpis);
      }
    } catch (err) {
      console.error('Error al cargar balance:', err);
      showToast('Error al conectar con balance financiero', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarBalance();
  }, []);

  const agregarDato = () => {
    if (!monto || isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
      showToast('Ingresa un monto numérico válido mayor a 0', 'error');
      return;
    }

    const valor = parseFloat(monto);
    const nuevas = [...transacciones];
    const index = nuevas.findIndex(t => t.fecha === dia);

    if (index >= 0) {
      if (tipo === 'ingresos') nuevas[index].ingresos += valor;
      else nuevas[index].gastos += valor;
    } else {
      nuevas.push({
        fecha: dia,
        ingresos: tipo === 'ingresos' ? valor : 0,
        gastos: tipo === 'gastos' ? valor : 0
      });
    }

    nuevas.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    let totIng = 0;
    let totGas = 0;
    nuevas.forEach(t => {
      totIng += t.ingresos;
      totGas += t.gastos;
    });
    const net = totIng - totGas;
    const marg = totIng > 0 ? ((net / totIng) * 100).toFixed(1) : '0';

    setTransacciones(nuevas);
    setKpis({
      totalIngresos: totIng,
      totalGastos: totGas,
      utilidadNeta: net,
      margen: marg
    });

    setMonto('');
    showToast(`Movimiento registrado como ${tipo === 'ingresos' ? 'Ingreso' : 'Egreso'}`);
  };

  // Encontrar el valor máximo para escalar barras
  const maxMonto = Math.max(
    ...transacciones.map(t => Math.max(t.ingresos || 0, t.gastos || 0)),
    100
  );

  return (
    <View style={styles.container}>
      {toast && (
        <View style={[styles.toast, toast.tipo === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Feather name={toast.tipo === 'success' ? 'check-circle' : 'alert-triangle'} size={18} color="#fff" />
          <Text style={styles.toastText}>{toast.mensaje}</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons name="view-dashboard" size={26} color="#6366f1" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Dashboard Central</Text>
            <Text style={styles.subtitle}>Balance financiero consolidado</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.btnSecondary} onPress={cargarBalance} disabled={loading}>
          <Feather name="refresh-cw" size={16} color="#94a3b8" />
          <Text style={styles.btnSecondaryText}>Actualizar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* 4 KPIs Consolidados */}
        <View style={styles.kpiGrid}>
          {/* Ingresos */}
          <View style={[styles.kpiCard, { borderLeftColor: '#10b981' }]}>
            <Text style={styles.kpiLabel}>Ingresos por Ventas</Text>
            <Text style={[styles.kpiValue, { color: '#34d399' }]}>
              ${Number(kpis.totalIngresos).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.kpiSub}>Total recaudado</Text>
          </View>

          {/* Egresos */}
          <View style={[styles.kpiCard, { borderLeftColor: '#f43f5e' }]}>
            <Text style={styles.kpiLabel}>Egresos Totales</Text>
            <Text style={[styles.kpiValue, { color: '#f87171' }]}>
              ${Number(kpis.totalGastos).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.kpiSub}>Compras y gastos</Text>
          </View>

          {/* Utilidad */}
          <View style={[styles.kpiCard, { borderLeftColor: '#6366f1' }]}>
            <Text style={styles.kpiLabel}>Utilidad Neta</Text>
            <Text style={[styles.kpiValue, { color: kpis.utilidadNeta >= 0 ? '#818cf8' : '#f87171' }]}>
              ${Number(kpis.utilidadNeta).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.kpiSub}>Margen final en caja</Text>
          </View>

          {/* Margen */}
          <View style={[styles.kpiCard, { borderLeftColor: '#c084fc' }]}>
            <Text style={styles.kpiLabel}>Margen Operativo</Text>
            <Text style={[styles.kpiValue, { color: '#c084fc' }]}>
              {kpis.margen}%
            </Text>
            <Text style={styles.kpiSub}>Rentabilidad sobre ventas</Text>
          </View>
        </View>

        {/* Registro de Flujo Rápido */}
        <View style={styles.flowCard}>
          <Text style={styles.flowCardTitle}>Registro de Flujo Rápido</Text>
          <Text style={styles.flowCardSub}>Ingresa un movimiento para actualizar el balance.</Text>

          <Text style={styles.formLabel}>Fecha de Movimiento</Text>
          <TextInput
            style={styles.formInput}
            value={dia}
            onChangeText={setDia}
            placeholder="AAAA-MM-DD"
            placeholderTextColor="#64748b"
          />

          <Text style={styles.formLabel}>Monto ($ MXN)</Text>
          <TextInput
            style={styles.formInput}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor="#64748b"
            value={monto}
            onChangeText={setMonto}
          />

          <Text style={styles.formLabel}>Tipo de Movimiento</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <TouchableOpacity
              style={[styles.typeBtn, tipo === 'ingresos' && styles.typeBtnActiveGreen]}
              onPress={() => setTipo('ingresos')}
            >
              <Feather name="arrow-up-circle" size={16} color={tipo === 'ingresos' ? '#fff' : '#94a3b8'} />
              <Text style={[styles.typeBtnText, tipo === 'ingresos' && styles.typeBtnTextActive]}>
                Ingreso (Venta)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeBtn, tipo === 'gastos' && styles.typeBtnActiveRed]}
              onPress={() => setTipo('gastos')}
            >
              <Feather name="arrow-down-circle" size={16} color={tipo === 'gastos' ? '#fff' : '#94a3b8'} />
              <Text style={[styles.typeBtnText, tipo === 'gastos' && styles.typeBtnTextActive]}>
                Egreso (Gasto)
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.btnRegistrar} onPress={agregarDato}>
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.btnRegistrarText}>Registrar Movimiento</Text>
          </TouchableOpacity>
        </View>

        {/* Gráfico / Evolución de Ingresos vs Gastos */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Balance de Ingresos y Gastos</Text>
              <Text style={styles.chartSub}>Historial comparativo por fechas</Text>
            </View>

            <View style={styles.chartLegends}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>Ingresos</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#f43f5e' }]} />
                <Text style={styles.legendText}>Gastos</Text>
              </View>
            </View>
          </View>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Cargando balance...</Text>
            </View>
          ) : (
            <View style={styles.barsList}>
              {transacciones.map((t, idx) => {
                const ingWidth = maxMonto > 0 ? (t.ingresos / maxMonto) * 100 : 0;
                const gasWidth = maxMonto > 0 ? (t.gastos / maxMonto) * 100 : 0;

                return (
                  <View key={idx} style={styles.barRow}>
                    <Text style={styles.barDate}>{t.fecha}</Text>
                    <View style={styles.barsContainer}>
                      {/* Barra Ingresos */}
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${Math.max(4, ingWidth)}%`, backgroundColor: '#10b981' }]} />
                        <Text style={styles.barValueText}>${Number(t.ingresos).toFixed(0)}</Text>
                      </View>
                      {/* Barra Gastos */}
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${Math.max(4, gasWidth)}%`, backgroundColor: '#f43f5e' }]} />
                        <Text style={styles.barValueText}>${Number(t.gastos).toFixed(0)}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', paddingHorizontal: 16, paddingTop: 12 },
  toast: {
    position: 'absolute', top: 10, left: 16, right: 16, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, elevation: 8
  },
  toastSuccess: { backgroundColor: '#059669' },
  toastError: { backgroundColor: '#e11d48' },
  toastText: { color: '#fff', fontWeight: '600', fontSize: 13, flex: 1 },
  header: { marginBottom: 14 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  headerIconContainer: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)'
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  subtitle: { fontSize: 12, color: '#94a3b8' },
  btnSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1e293b',
    borderWidth: 1, borderColor: '#334155', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    alignSelf: 'flex-start'
  },
  btnSecondaryText: { color: '#94a3b8', fontWeight: '600', fontSize: 13 },
  kpiGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14
  },
  kpiCard: {
    flex: 1, minWidth: '47%', backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155',
    borderLeftWidth: 4, borderRadius: 12, padding: 12
  },
  kpiLabel: { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', fontWeight: '700' },
  kpiValue: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginVertical: 4 },
  kpiSub: { color: '#64748b', fontSize: 10 },
  flowCard: {
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 14,
    padding: 16, marginBottom: 14
  },
  flowCardTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  flowCardSub: { color: '#94a3b8', fontSize: 12, marginBottom: 12, marginTop: 2 },
  formLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  formInput: {
    backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, color: '#ffffff', fontSize: 13, marginBottom: 10
  },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 8, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155'
  },
  typeBtnActiveGreen: { backgroundColor: '#059669', borderColor: '#10b981' },
  typeBtnActiveRed: { backgroundColor: '#e11d48', borderColor: '#f43f5e' },
  typeBtnText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  typeBtnTextActive: { color: '#ffffff', fontWeight: 'bold' },
  btnRegistrar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#6366f1', paddingVertical: 12, borderRadius: 10, marginTop: 4
  },
  btnRegistrarText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  chartCard: {
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 14,
    padding: 16, marginBottom: 14
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  chartTitle: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  chartSub: { color: '#94a3b8', fontSize: 11, marginTop: 1 },
  chartLegends: { flexDirection: 'row', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#94a3b8', fontSize: 11 },
  barsList: { gap: 12 },
  barRow: { marginBottom: 4 },
  barDate: { color: '#94a3b8', fontSize: 11, fontFamily: 'monospace', marginBottom: 4 },
  barsContainer: { gap: 4 },
  barTrack: { height: 16, backgroundColor: '#0f172a', borderRadius: 4, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barValueText: { color: '#cbd5e1', fontSize: 10, marginLeft: 6, fontWeight: 'bold' },
  centerBox: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#94a3b8', fontSize: 13, marginTop: 8 },
});

