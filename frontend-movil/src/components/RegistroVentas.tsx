import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { ENDPOINTS } from '../config/api';

const API_VENTAS = ENDPOINTS.ventas;
const API_PRODUCTOS = ENDPOINTS.productos;

export default function RegistroVentas() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [resumen, setResumen] = useState({
    totalRecaudado: 0,
    totalOrdenes: 0,
    ticketPromedio: 0,
    desgloseMetodos: {} as Record<string, number>
  });
  const [productosMenu, setProductosMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('Todos');

  // Modal Crear / Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);

  const hoy = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState<{
    fecha_venta: string;
    metodo_pago: string;
    items: any[];
  }>({
    fecha_venta: hoy,
    metodo_pago: 'Efectivo',
    items: []
  });

  const [productoSeleccionado, setProductoSeleccionado] = useState<string>('');
  const [cantidadProducto, setCantidadProducto] = useState(1);
  const [filaExpandida, setFilaExpandida] = useState<number | null>(null);

  // Modal Eliminar
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ventaAEliminar, setVentaAEliminar] = useState<any>(null);

  // Modal Reporte
  const [reporteModalOpen, setReporteModalOpen] = useState(false);
  const [datosReporte, setDatosReporte] = useState<any>(null);
  const [cargandoReporte, setCargandoReporte] = useState(false);
  const [reporteFiltroFechas, setReporteFiltroFechas] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    metodo_pago: 'Todos'
  });

  // Toast
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'success' | 'error' } | null>(null);

  const showToast = (mensaje: string, tipo: 'success' | 'error' = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  const cargarVentas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_VENTAS);
      const data = await res.json();
      if (data.success) {
        setVentas(data.data || []);
        if (data.resumen) setResumen(data.resumen);
      } else {
        setError(data.message || 'Error al obtener ventas');
      }
    } catch (err) {
      console.error('Error al conectar con backend:', err);
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const cargarProductos = async () => {
    try {
      const res = await fetch(API_PRODUCTOS);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setProductosMenu(data.data);
        setProductoSeleccionado(String(data.data[0].id_producto));
      }
    } catch (err) {
      console.error('Error al cargar menú de productos:', err);
    }
  };

  useEffect(() => {
    cargarVentas();
    cargarProductos();
  }, []);

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setIdEditando(null);
    setFormData({
      fecha_venta: hoy,
      metodo_pago: 'Efectivo',
      items: []
    });
    setCantidadProducto(1);
    if (productosMenu.length > 0) {
      setProductoSeleccionado(String(productosMenu[0].id_producto));
    }
    setModalOpen(true);
  };

  const abrirModalEditar = (venta: any) => {
    setModoEdicion(true);
    setIdEditando(venta.id_venta);

    const itemsExistentes = (venta.detalles || []).map((d: any) => ({
      id_producto: d.id_producto,
      nombre_producto: d.nombre_producto,
      cantidad: d.cantidad,
      precio_unitario: parseFloat(d.precio_unitario),
      subtotal: parseFloat(d.subtotal)
    }));

    setFormData({
      fecha_venta: venta.fecha_venta,
      metodo_pago: venta.metodo_pago,
      items: itemsExistentes
    });
    setCantidadProducto(1);
    setModalOpen(true);
  };

  const agregarItemOrden = () => {
    if (!productoSeleccionado) return;
    const prod = productosMenu.find(p => String(p.id_producto) === String(productoSeleccionado));
    if (!prod) return;

    if (cantidadProducto <= 0) {
      showToast('Ingresa una cantidad válida', 'error');
      return;
    }

    const itemsActuales = [...formData.items];
    const indexExistente = itemsActuales.findIndex(i => String(i.id_producto) === String(prod.id_producto));

    if (indexExistente >= 0) {
      itemsActuales[indexExistente].cantidad += cantidadProducto;
      itemsActuales[indexExistente].subtotal = itemsActuales[indexExistente].cantidad * itemsActuales[indexExistente].precio_unitario;
    } else {
      itemsActuales.push({
        id_producto: prod.id_producto,
        nombre_producto: prod.nombre_producto,
        cantidad: cantidadProducto,
        precio_unitario: parseFloat(prod.precio),
        subtotal: cantidadProducto * parseFloat(prod.precio)
      });
    }

    setFormData({ ...formData, items: itemsActuales });
    setCantidadProducto(1);
  };

  const removerItemOrden = (index: number) => {
    const nuevos = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: nuevos });
  };

  const cambiarCantidadItem = (index: number, delta: number) => {
    const nuevos = [...formData.items];
    const item = nuevos[index];
    const nuevaCant = item.cantidad + delta;
    if (nuevaCant <= 0) {
      removerItemOrden(index);
      return;
    }
    item.cantidad = nuevaCant;
    item.subtotal = nuevaCant * item.precio_unitario;
    setFormData({ ...formData, items: nuevos });
  };

  const totalOrden = formData.items.reduce((acc, it) => acc + it.subtotal, 0);

  const handleSubmitVenta = async () => {
    if (formData.items.length === 0) {
      showToast('Agrega al menos un platillo o bebida a la orden', 'error');
      return;
    }

    setGuardando(true);
    try {
      const url = modoEdicion ? `${API_VENTAS}/${idEditando}` : API_VENTAS;
      const method = modoEdicion ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha_venta: formData.fecha_venta,
          metodo_pago: formData.metodo_pago,
          items: formData.items
        })
      });

      const resData = await res.json();
      if (resData.success) {
        showToast(modoEdicion ? 'Venta actualizada exitosamente' : 'Venta registrada exitosamente');
        setModalOpen(false);
        cargarVentas();
      } else {
        showToast(resData.message || 'Error al guardar la venta', 'error');
      }
    } catch (err) {
      console.error('Error al guardar venta:', err);
      showToast('Error de conexión con el servidor', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!ventaAEliminar) return;
    try {
      const res = await fetch(`${API_VENTAS}/${ventaAEliminar.id_venta}`, {
        method: 'DELETE'
      });
      const resData = await res.json();
      if (resData.success) {
        showToast('Venta anulada correctamente');
        setDeleteModalOpen(false);
        setVentaAEliminar(null);
        cargarVentas();
      } else {
        showToast(resData.message || 'Error al eliminar venta', 'error');
      }
    } catch (err) {
      console.error('Error al eliminar venta:', err);
      showToast('Error de conexión con el servidor', 'error');
    }
  };

  const consultarReporte = async (filtros = reporteFiltroFechas) => {
    setCargandoReporte(true);
    try {
      const params = new URLSearchParams();
      if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
      if (filtros.metodo_pago && filtros.metodo_pago !== 'Todos') {
        params.append('metodo_pago', filtros.metodo_pago);
      }

      const res = await fetch(`${API_VENTAS}/reporte?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDatosReporte(data.reporte);
      }
    } catch (err) {
      console.error('Error al cargar reporte:', err);
      showToast('Error al consultar el reporte', 'error');
    } finally {
      setCargandoReporte(false);
    }
  };

  const abrirReporte = () => {
    setReporteModalOpen(true);
    consultarReporte(reporteFiltroFechas);
  };

  const aplicarAtajoFechas = (tipo: 'hoy' | 'semana' | 'mes' | 'todo') => {
    const ahora = new Date();
    let inicio = '';
    let fin = ahora.toISOString().split('T')[0];

    if (tipo === 'hoy') {
      inicio = fin;
    } else if (tipo === 'semana') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      inicio = d.toISOString().split('T')[0];
    } else if (tipo === 'mes') {
      const primerDia = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      inicio = primerDia.toISOString().split('T')[0];
    } else if (tipo === 'todo') {
      inicio = '';
      fin = '';
    }

    const nuevosFiltros = {
      ...reporteFiltroFechas,
      fecha_inicio: inicio,
      fecha_fin: fin
    };
    setReporteFiltroFechas(nuevosFiltros);
    consultarReporte(nuevosFiltros);
  };

  const ventasFiltradas = ventas.filter(v => {
    const coincideMetodo = filtroMetodo === 'Todos' || v.metodo_pago === filtroMetodo;
    const coincideBusqueda = (v.detalles || []).some((d: any) => d.nombre_producto.toLowerCase().includes(busqueda.toLowerCase())) ||
      v.metodo_pago.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.fecha_venta.includes(busqueda);
    return coincideMetodo && (busqueda === '' || coincideBusqueda);
  });

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
            <MaterialCommunityIcons name="cash-register" size={26} color="#10b981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Registro de Ventas</Text>
            <Text style={styles.subtitle}>Comandas, ingresos y formas de pago</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.btnSecondary} onPress={abrirReporte}>
            <Feather name="file-text" size={15} color="#818cf8" />
            <Text style={styles.btnSecondaryText}>Reporte</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnPrimary} onPress={abrirModalCrear}>
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.btnPrimaryText}>Nueva Venta</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* KPIs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpisScroll}>
          <View style={[styles.kpiCard, { borderLeftColor: '#10b981' }]}>
            <Text style={styles.kpiLabel}>Total Recaudado</Text>
            <Text style={[styles.kpiValue, { color: '#34d399' }]}>
              ${Number(resumen.totalRecaudado).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.kpiSub, { color: '#34d399' }]}>Ingresos acumulados</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#6366f1' }]}>
            <Text style={styles.kpiLabel}>Total Órdenes</Text>
            <Text style={styles.kpiValue}>{resumen.totalOrdenes}</Text>
            <Text style={styles.kpiSub}>Tickets cerrados</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#3b82f6' }]}>
            <Text style={styles.kpiLabel}>Ticket Promedio</Text>
            <Text style={styles.kpiValue}>
              ${Number(resumen.ticketPromedio).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.kpiSub, { color: '#60a5fa' }]}>Por cliente</Text>
          </View>
        </ScrollView>

        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Buscar por platillo, método o fecha..."
            placeholderTextColor="#64748b"
            value={busqueda}
            onChangeText={setBusqueda}
            style={styles.searchInput}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Feather name="x" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Métodos de Pago Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {['Todos', 'Efectivo', 'Tarjeta de Débito', 'Tarjeta de Crédito', 'Transferencia'].map((m) => {
            const activo = filtroMetodo === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.filterChip, activo && styles.filterChipActive]}
                onPress={() => setFiltroMetodo(m)}
              >
                <Text style={[styles.filterChipText, activo && styles.filterChipTextActive]}>
                  {m}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Listado de Ventas */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Cargando ventas...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Ionicons name="alert-circle-outline" size={44} color="#f43f5e" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.btnRetry} onPress={cargarVentas}>
              <Text style={styles.btnRetryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : ventasFiltradas.length === 0 ? (
          <View style={styles.centerBox}>
            <MaterialCommunityIcons name="cash-remove" size={44} color="#475569" />
            <Text style={styles.emptyTitle}>No hay ventas registradas</Text>
            <Text style={styles.emptySub}>Presiona "+ Nueva Venta" para cobrar comandas.</Text>
          </View>
        ) : (
          ventasFiltradas.map((v) => {
            const expandido = filaExpandida === v.id_venta;
            return (
              <View key={v.id_venta} style={styles.cardItem}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>Orden #{v.id_venta}</Text>
                    <Text style={styles.cardDate}>Fecha: {v.fecha_venta}</Text>
                  </View>

                  <View style={styles.badgeMetodo}>
                    <Text style={styles.badgeMetodoText}>{v.metodo_pago}</Text>
                  </View>
                </View>

                <View style={styles.cardBodyRow}>
                  <View>
                    <Text style={styles.dataLabel}>Total Cobrado</Text>
                    <Text style={[styles.dataValue, { color: '#34d399', fontSize: 16 }]}>
                      ${parseFloat(v.total).toFixed(2)} MXN
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.btnExpand}
                    onPress={() => setFilaExpandida(expandido ? null : v.id_venta)}
                  >
                    <Text style={styles.btnExpandText}>
                      {expandido ? 'Ocultar Detalle' : `Ver Platillos (${(v.detalles || []).length})`}
                    </Text>
                    <Feather name={expandido ? 'chevron-up' : 'chevron-down'} size={14} color="#818cf8" />
                  </TouchableOpacity>
                </View>

                {/* Desglose Expandido */}
                {expandido && (
                  <View style={styles.expandedDetails}>
                    <Text style={styles.expandedTitle}>Comanda / Platillos:</Text>
                    {(v.detalles || []).map((det: any, i: number) => (
                      <View key={i} style={styles.detailRow}>
                        <Text style={styles.detailName}>
                          {det.cantidad}x {det.nombre_producto}
                        </Text>
                        <Text style={styles.detailPrice}>
                          ${parseFloat(det.subtotal).toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => abrirModalEditar(v)}
                  >
                    <Feather name="edit-2" size={14} color="#818cf8" />
                    <Text style={[styles.cardActionText, { color: '#818cf8' }]}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cardActionBtn, { borderColor: 'rgba(244, 63, 94, 0.3)' }]}
                    onPress={() => {
                      setVentaAEliminar(v);
                      setDeleteModalOpen(true);
                    }}
                  >
                    <Feather name="trash-2" size={14} color="#f87171" />
                    <Text style={[styles.cardActionText, { color: '#f87171' }]}>Anular</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Nueva / Editar Venta */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {modoEdicion ? 'Editar Venta' : 'Registrar Nueva Venta'}
                </Text>
                <Text style={styles.modalSub}>Cobro de orden o comanda</Text>
              </View>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Feather name="x" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Fecha *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.fecha_venta}
                    onChangeText={(t) => setFormData({ ...formData, fecha_venta: t })}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Forma de Pago *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['Efectivo', 'Tarjeta de Débito', 'Tarjeta de Crédito', 'Transferencia'].map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.pillSmall, formData.metodo_pago === m && styles.pillSmallActive]}
                        onPress={() => setFormData({ ...formData, metodo_pago: m })}
                      >
                        <Text style={[styles.pillSmallText, formData.metodo_pago === m && styles.pillSmallTextActive]}>
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Sección Agregar Platillos */}
              <View style={styles.addDishBox}>
                <Text style={styles.boxTitle}>Agregar Platillo / Bebida al Ticket</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  {productosMenu.map((p) => {
                    const sel = String(productoSeleccionado) === String(p.id_producto);
                    return (
                      <TouchableOpacity
                        key={p.id_producto}
                        style={[styles.dishChip, sel && styles.dishChipActive]}
                        onPress={() => setProductoSeleccionado(String(p.id_producto))}
                      >
                        <Text style={[styles.dishChipTitle, sel && styles.dishChipTitleActive]}>
                          {p.nombre_producto}
                        </Text>
                        <Text style={styles.dishChipPrice}>${parseFloat(p.precio).toFixed(2)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={styles.stepperWrap}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setCantidadProducto(Math.max(1, cantidadProducto - 1))}
                    >
                      <Feather name="minus" size={16} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.stepperVal}>{cantidadProducto}</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setCantidadProducto(cantidadProducto + 1)}
                    >
                      <Feather name="plus" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.btnAddDish} onPress={agregarItemOrden}>
                    <Feather name="shopping-bag" size={15} color="#fff" />
                    <Text style={styles.btnAddDishText}>Agregar a la Orden</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Carrito de Platillos */}
              <Text style={styles.formLabel}>Platillos en esta Orden ({formData.items.length})</Text>
              {formData.items.length === 0 ? (
                <View style={styles.emptyCartBox}>
                  <Text style={styles.emptyCartText}>No has agregado ningún platillo a esta comanda.</Text>
                </View>
              ) : (
                formData.items.map((it, idx) => (
                  <View key={idx} style={styles.cartItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cartItemName}>{it.nombre_producto}</Text>
                      <Text style={styles.cartItemPrice}>
                        ${it.precio_unitario.toFixed(2)} c/u
                      </Text>
                    </View>

                    <View style={styles.stepperMini}>
                      <TouchableOpacity onPress={() => cambiarCantidadItem(idx, -1)}>
                        <Feather name="minus-circle" size={18} color="#94a3b8" />
                      </TouchableOpacity>
                      <Text style={styles.stepperMiniVal}>{it.cantidad}</Text>
                      <TouchableOpacity onPress={() => cambiarCantidadItem(idx, 1)}>
                        <Feather name="plus-circle" size={18} color="#818cf8" />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.cartItemSubtotal}>${it.subtotal.toFixed(2)}</Text>

                    <TouchableOpacity onPress={() => removerItemOrden(idx)} style={{ marginLeft: 8 }}>
                      <Feather name="trash-2" size={16} color="#f87171" />
                    </TouchableOpacity>
                  </View>
                ))
              )}

              {/* Total Orden */}
              <View style={styles.totalBox}>
                <Text style={styles.totalBoxLabel}>Total a Cobrar:</Text>
                <Text style={styles.totalBoxValue}>${totalOrden.toFixed(2)} MXN</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => setModalOpen(false)}>
                  <Text style={styles.btnSecondaryText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnPrimary, guardando && { opacity: 0.7 }]}
                  onPress={handleSubmitVenta}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>
                      {modoEdicion ? 'Actualizar Venta' : 'Cobrar Orden'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Reporte de Ventas */}
      <Modal visible={reporteModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Reporte Ejecutivo de Ventas</Text>
                <Text style={styles.modalSub}>Análisis de recaudación y top platillos</Text>
              </View>
              <TouchableOpacity onPress={() => setReporteModalOpen(false)}>
                <Feather name="x" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Atajos de fechas */}
              <View style={styles.shortcutsRow}>
                {(['hoy', 'semana', 'mes', 'todo'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={styles.shortcutBtn}
                    onPress={() => aplicarAtajoFechas(t)}
                  >
                    <Text style={styles.shortcutBtnText}>{t.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {cargandoReporte ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="large" color="#6366f1" />
                  <Text style={styles.loadingText}>Generando métricas del reporte...</Text>
                </View>
              ) : datosReporte ? (
                <>
                  {/* Resumen Métricas */}
                  <View style={styles.reportKpiBox}>
                    <View style={styles.reportKpiItem}>
                      <Text style={styles.reportKpiLabel}>Recaudado</Text>
                      <Text style={[styles.reportKpiVal, { color: '#34d399' }]}>
                        ${parseFloat(datosReporte.resumen?.total_recaudado || 0).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.reportKpiItem}>
                      <Text style={styles.reportKpiLabel}>Órdenes</Text>
                      <Text style={styles.reportKpiVal}>
                        {datosReporte.resumen?.total_ordenes || 0}
                      </Text>
                    </View>
                    <View style={styles.reportKpiItem}>
                      <Text style={styles.reportKpiLabel}>Promedio</Text>
                      <Text style={styles.reportKpiVal}>
                        ${parseFloat(datosReporte.resumen?.promedio_orden || 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  {/* Top Platillos */}
                  <Text style={styles.formLabel}>Platillos Más Vendidos</Text>
                  {(datosReporte.topProductos || []).map((p: any, i: number) => (
                    <View key={i} style={styles.topProductRow}>
                      <Text style={styles.topProductRank}>#{i + 1}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.topProductName}>{p.nombre_producto}</Text>
                        <Text style={styles.topProductQty}>{p.total_vendido} órdenes vendidas</Text>
                      </View>
                      <Text style={styles.topProductTotal}>${parseFloat(p.ingresos_generados).toFixed(2)}</Text>
                    </View>
                  ))}
                </>
              ) : null}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.btnPrimary, { width: '100%', justifyContent: 'center' }]}
                  onPress={() => setReporteModalOpen(false)}
                >
                  <Text style={styles.btnPrimaryText}>Cerrar Reporte</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Confirmación de Eliminación */}
      <Modal visible={deleteModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 360, alignItems: 'center' }]}>
            <View style={styles.deleteIconWrap}>
              <Feather name="trash-2" size={28} color="#f43f5e" />
            </View>
            <Text style={styles.modalTitle}>¿Anular Venta?</Text>
            <Text style={styles.deleteDesc}>
              Se anulará la orden #{ventaAEliminar?.id_venta} por un total de ${parseFloat(ventaAEliminar?.total || '0').toFixed(2)}. Esta acción no se puede revertir.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity
                style={[styles.btnSecondary, { flex: 1, justifyContent: 'center' }]}
                onPress={() => setDeleteModalOpen(false)}
              >
                <Text style={styles.btnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnDanger, { flex: 1, justifyContent: 'center' }]}
                onPress={confirmarEliminar}
              >
                <Text style={styles.btnPrimaryText}>Sí, Anular</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  subtitle: { fontSize: 12, color: '#94a3b8' },
  headerActions: { flexDirection: 'row', gap: 10 },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#6366f1',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10
  },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  btnSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1e293b',
    borderWidth: 1, borderColor: '#334155', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10
  },
  btnSecondaryText: { color: '#94a3b8', fontWeight: '600', fontSize: 13 },
  btnDanger: { backgroundColor: '#e11d48', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  kpisScroll: { marginBottom: 14 },
  kpiCard: {
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderLeftWidth: 4,
    borderRadius: 12, padding: 12, marginRight: 10, minWidth: 135
  },
  kpiLabel: { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', fontWeight: '700' },
  kpiValue: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginVertical: 4 },
  kpiSub: { color: '#64748b', fontSize: 10 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderWidth: 1,
    borderColor: '#334155', borderRadius: 12, paddingHorizontal: 12, height: 44, marginBottom: 10
  },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 13 },
  filtersScroll: { marginBottom: 14 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: '#1e293b', marginRight: 8 },
  filterChipActive: { backgroundColor: '#10b981' },
  filterChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#ffffff' },
  centerBox: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#94a3b8', fontSize: 13, marginTop: 8 },
  errorText: { color: '#f87171', fontSize: 13, textAlign: 'center', marginVertical: 8 },
  btnRetry: { backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  btnRetryText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyTitle: { color: '#ffffff', fontWeight: 'bold', fontSize: 15, marginTop: 8 },
  emptySub: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 4 },
  cardItem: {
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 14,
    padding: 14, marginBottom: 12
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardTitle: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  cardDate: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  badgeMetodo: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)', borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12
  },
  badgeMetodoText: { color: '#818cf8', fontSize: 11, fontWeight: 'bold' },
  cardBodyRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#0f172a', borderRadius: 10, padding: 12, marginBottom: 10
  },
  dataLabel: { color: '#64748b', fontSize: 10, textTransform: 'uppercase', fontWeight: '600' },
  dataValue: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', marginTop: 2 },
  btnExpand: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  btnExpandText: { color: '#818cf8', fontSize: 12, fontWeight: '600' },
  expandedDetails: {
    backgroundColor: '#0f172a', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#334155'
  },
  expandedTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  detailName: { color: '#ffffff', fontSize: 12 },
  detailPrice: { color: '#34d399', fontSize: 12, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  cardActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: '#334155', backgroundColor: '#1e293b'
  },
  cardActionText: { fontSize: 11, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { width: '100%', maxHeight: '90%', backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155', padding: 18 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 12, marginBottom: 14 },
  modalTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  modalSub: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  formLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, marginTop: 8 },
  formInput: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#ffffff', fontSize: 13 },
  pillSmall: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 6 },
  pillSmallActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  pillSmallText: { color: '#94a3b8', fontSize: 11 },
  pillSmallTextActive: { color: '#ffffff', fontWeight: 'bold' },
  addDishBox: { backgroundColor: '#0f172a', borderRadius: 12, padding: 12, marginVertical: 10, borderWidth: 1, borderColor: '#334155' },
  boxTitle: { color: '#e2e8f0', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  dishChip: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', padding: 8, borderRadius: 10, marginRight: 8, minWidth: 100 },
  dishChipActive: { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  dishChipTitle: { color: '#ffffff', fontSize: 11, fontWeight: '600' },
  dishChipTitleActive: { color: '#34d399' },
  dishChipPrice: { color: '#10b981', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  stepperWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  stepperBtn: { padding: 8 },
  stepperVal: { color: '#ffffff', fontWeight: 'bold', fontSize: 13, paddingHorizontal: 10 },
  btnAddDish: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#10b981', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  btnAddDishText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyCartBox: { padding: 16, backgroundColor: '#0f172a', borderRadius: 10, alignItems: 'center' },
  emptyCartText: { color: '#64748b', fontSize: 12 },
  cartItemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', padding: 10, borderRadius: 8, marginBottom: 6, borderWidth: 1, borderColor: '#334155' },
  cartItemName: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  cartItemPrice: { color: '#94a3b8', fontSize: 10 },
  stepperMini: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 8 },
  stepperMiniVal: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  cartItemSubtotal: { color: '#34d399', fontWeight: 'bold', fontSize: 12 },
  totalBox: { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)', borderRadius: 10, padding: 14, marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalBoxLabel: { color: '#a7f3d0', fontSize: 13, fontWeight: 'bold' },
  totalBoxValue: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  shortcutsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  shortcutBtn: { flex: 1, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  shortcutBtnText: { color: '#818cf8', fontSize: 11, fontWeight: 'bold' },
  reportKpiBox: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  reportKpiItem: { flex: 1, alignItems: 'center' },
  reportKpiLabel: { color: '#64748b', fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold' },
  reportKpiVal: { color: '#ffffff', fontSize: 15, fontWeight: 'bold', marginTop: 2 },
  topProductRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', padding: 10, borderRadius: 8, marginBottom: 6 },
  topProductRank: { color: '#818cf8', fontWeight: 'bold', fontSize: 14, width: 28 },
  topProductName: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  topProductQty: { color: '#64748b', fontSize: 10 },
  topProductTotal: { color: '#34d399', fontWeight: 'bold', fontSize: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 14 },
  deleteIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(244, 63, 94, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  deleteDesc: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginVertical: 12 },
});

