import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    FlatList,
    Alert,
    ActivityIndicator,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {
    actualizarPedido,
    registrarAbono,
    obtenerPedidoPorId,
} from '../services/orderServices.js';
import { obtenerTasaDolar } from '../services/configService.js';
import { obtenerPlatillos } from '../services/dishService.js';

// ── Colores por estado ─────────────────────────────────────────────
const ESTADO_COLOR = {
    pendiente:  '#e53935',
    abonado:    '#fb8c00',
    completado: '#43a047',
    cancelado:  '#757575',
};

const PedidoDetalle = ({ route, navigation }) => {
    const pedidoId = route.params?.id;

    const [menuDisponible,      setMenuDisponible]      = useState([]);
    const [tasa,                setTasa]                = useState(null);
    const [isLoading,           setIsLoading]           = useState(true);
    const [pedidoActual,        setPedidoActual]        = useState(null);
    const [modalAbonoVisible,   setModalAbonoVisible]   = useState(false);
    const [selectorVisible,     setSelectorVisible]     = useState(false);
    const [montoAbonar,         setMontoAbonar]         = useState('');
    const [metodoPago,          setMetodoPago]          = useState('efectivo');
    const [monedaAbono,         setMonedaAbono]         = useState('usd');
    const [platilloSeleccionado,setPlatilloSeleccionado]= useState(null);

    // ── Cargar datos ───────────────────────────────────────────────
    useEffect(() => {
        const cargar = async () => {
            if (!pedidoId) { Alert.alert('Error', 'ID no proporcionado.'); navigation.goBack(); return; }
            try {
                const pedido = await obtenerPedidoPorId(pedidoId);
                if (!pedido) throw new Error('Pedido no encontrado.');
                setPedidoActual({ ...pedido, monto_abonado_usd: pedido.monto_abonado_usd ?? 0, monto_abonado_bs: pedido.monto_abonado_bs ?? 0 });

                const platillos = await obtenerPlatillos();
                setMenuDisponible(platillos);
                if (platillos.length > 0) setPlatilloSeleccionado(platillos[0].id);

                const tasaStr = await obtenerTasaDolar();
                if (tasaStr) setTasa(parseFloat(tasaStr));
            } catch (e) {
                Alert.alert('Error', e.message);
                navigation.goBack();
            } finally {
                setIsLoading(false);
            }
        };
        cargar();
    }, [pedidoId]);

    // ── Cálculos ───────────────────────────────────────────────────
    const calcularTotales = () => {
        let totalUsd = 0, totalBs = 0;
        pedidoActual.items.forEach(item => {
            const usd = item.precioUsd ?? item.precio_usd ?? 0;
            totalUsd += item.cantidad * usd;
            totalBs  += item.cantidad * (tasa ? usd * tasa : 0);
        });
        const pagadoUsd    = pedidoActual.monto_abonado_usd || 0;
        const pagadoBs     = pedidoActual.monto_abonado_bs  || 0;
        const pendienteUsd = Math.max(0, totalUsd - pagadoUsd);
        const pendienteBs  = Math.max(0, totalBs  - pagadoBs);
        const cambioUsd    = pagadoUsd > totalUsd ? pagadoUsd - totalUsd : 0;
        const cambioBs     = pagadoBs  > totalBs  ? pagadoBs  - totalBs  : 0;
        return { totalUsd, totalBs, pagadoUsd, pagadoBs, pendienteUsd, pendienteBs, cambioUsd, cambioBs };
    };

    // ── Handlers ───────────────────────────────────────────────────
    const handleAbonar = async () => {
        const monto = parseFloat(montoAbonar.trim().replace(',', '.'));
        if (isNaN(monto) || monto <= 0 || !tasa) { Alert.alert('⚠️', 'Ingresa un monto válido.'); return; }
        try {
            const montoUSD = monedaAbono === 'usd' ? monto : parseFloat((monto / tasa).toFixed(2));
            await registrarAbono(pedidoActual.id, montoUSD, metodoPago);
            Alert.alert('✅ Abono registrado');
            setModalAbonoVisible(false);
            setMontoAbonar('');
            navigation.goBack();
        } catch (e) {
            Alert.alert('Error', e.message);
        }
    };

    const guardarCambios = async () => {
        const { totalUsd } = calcularTotales();
        try {
            await actualizarPedido(pedidoActual.id, { items: pedidoActual.items, total_usd: parseFloat(totalUsd) });
            Alert.alert('✅ Cambios guardados');
            navigation.goBack();
        } catch { Alert.alert('Error', 'No se pudo guardar.'); }
    };

    const modificarCantidad = (id, delta) =>
        setPedidoActual(prev => ({
            ...prev,
            items: prev.items.map(item => item.id === id ? { ...item, cantidad: Math.max(1, item.cantidad + delta) } : item),
        }));

    const eliminarItem = (id) =>
        setPedidoActual(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));

    const agregarPlatillo = () => {
        const p = menuDisponible.find(x => x.id === platilloSeleccionado);
        if (!p) return;
        const items = pedidoActual.items.find(x => x.id === p.id)
            ? pedidoActual.items.map(x => x.id === p.id ? { ...x, cantidad: x.cantidad + 1 } : x)
            : [...pedidoActual.items, { ...p, cantidad: 1, precioUsd: p.precio_usd, precioBs: p.precio_usd * tasa }];
        setPedidoActual(prev => ({ ...prev, items }));
        setSelectorVisible(false);
    };

    // ── Loading ────────────────────────────────────────────────────
    if (isLoading || !tasa || !pedidoActual) {
        return (
            <View style={s.loadingWrap}>
                <ActivityIndicator size="large" color="#c21c1c" />
                <Text style={s.loadingText}>Cargando pedido…</Text>
            </View>
        );
    }

    const resumen    = calcularTotales();
    const completado = pedidoActual.estado === 'completado';
    const estadoColor = ESTADO_COLOR[pedidoActual.estado] || '#333';

    // ── Render item de la lista ────────────────────────────────────
    const renderItem = ({ item }) => {
        const usd = item.precioUsd ?? item.precio_usd ?? 0;
        return (
            <View style={s.item}>
                <View style={s.itemRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.itemNombre}>{item.nombre}</Text>
                        <Text style={s.itemDetalle}>
                            ${usd.toFixed(2)}  ·  Bs {(usd * tasa).toFixed(2)} c/u
                        </Text>
                    </View>
                    <Text style={s.itemSubtotal}>${(item.cantidad * usd).toFixed(2)}</Text>
                </View>
                {!completado && (
                    <View style={s.itemControles}>
                        <TouchableOpacity style={s.ctrlBtn} onPress={() => modificarCantidad(item.id, -1)}>
                            <Text style={s.ctrlTxt}>−</Text>
                        </TouchableOpacity>
                        <Text style={s.ctrlCant}>{item.cantidad}</Text>
                        <TouchableOpacity style={s.ctrlBtn} onPress={() => modificarCantidad(item.id, 1)}>
                            <Text style={s.ctrlTxt}>+</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.ctrlBtn, s.ctrlBtnDel]} onPress={() => eliminarItem(item.id)}>
                            <Ionicons name="trash-outline" size={15} color="#f44336" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={s.safeArea} edges={['left', 'right']}>

            {/* ── Header custom con back ── */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.headerNombre} numberOfLines={1}>
                        {pedidoActual.clientName || pedidoActual.cliente_nombre}
                    </Text>
                    {(pedidoActual.clientAddress || pedidoActual.cliente_direccion) ? (
                        <Text style={s.headerDir} numberOfLines={1}>
                            📍 {pedidoActual.clientAddress || pedidoActual.cliente_direccion}
                        </Text>
                    ) : null}
                </View>
                <View style={[s.estadoBadge, { backgroundColor: estadoColor }]}>
                    <Text style={s.estadoTexto}>{pedidoActual.estado.toUpperCase()}</Text>
                </View>
            </View>

            {/* ── Resumen financiero visible de entrada ── */}
            <View style={s.resumenCard}>
                <View style={s.resumenFila}>
                    <Text style={s.resumenLabel}>Total</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={s.resumenValorPrincipal}>${resumen.totalUsd.toFixed(2)}</Text>
                        <Text style={s.resumenValorSec}>Bs {resumen.totalBs.toFixed(2)}</Text>
                    </View>
                </View>
                <View style={s.resumenDivider} />
                <View style={s.resumenFila}>
                    <Text style={s.resumenLabel}>Pagado</Text>
                    <Text style={s.resumenPagado}>${resumen.pagadoUsd.toFixed(2)}</Text>
                </View>
                <View style={s.resumenDivider} />
                <View style={s.resumenFila}>
                    <Text style={s.resumenLabel}>
                        {resumen.cambioUsd > 0 ? 'Cambio' : 'Pendiente'}
                    </Text>
                    <Text style={resumen.cambioUsd > 0 ? s.resumenCambio : s.resumenPendiente}>
                        ${resumen.cambioUsd > 0
                            ? resumen.cambioUsd.toFixed(2)
                            : resumen.pendienteUsd.toFixed(2)}
                    </Text>
                </View>
            </View>

            {/* ── Lista items (scroll si hay muchos) ── */}
            <View style={s.listaWrap}>
                <Text style={s.secLabel}>Platillos</Text>
                <FlatList
                    data={pedidoActual.items}
                    keyExtractor={(item, i) => item.id + i}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 8 }}
                    showsVerticalScrollIndicator={false}
                />
            </View>

            {/* ── Barra de acciones fija ── */}
            <View style={s.actionsBar}>
                {!completado && (
                    <>
                        <TouchableOpacity
                            style={s.btnCompletar}
                            onPress={async () => {
                                const m = parseFloat(resumen.pendienteUsd);
                                if (m > 0) await registrarAbono(pedidoActual.id, m, 'cierre_automatico');
                                else await actualizarPedido(pedidoActual.id, { estado: 'completado' });
                                Alert.alert('✅ Pedido completado');
                                navigation.goBack();
                            }}
                        >
                            <Text style={s.btnTxt}>Completar Pedido</Text>
                        </TouchableOpacity>

                        <View style={s.btnFila}>
                            <TouchableOpacity style={s.btnAbonar} onPress={() => setModalAbonoVisible(true)}>
                                <Ionicons name="card-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={s.btnTxt}>Abonar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.btnAgregar} onPress={() => setSelectorVisible(true)}>
                                <Ionicons name="add-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={s.btnTxt}>Agregar Platillo</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
                <TouchableOpacity style={s.btnGuardar} onPress={guardarCambios}>
                    <Text style={s.btnTxt}>Guardar Cambios</Text>
                </TouchableOpacity>
            </View>

            {/* ── Modal Abonar ── */}
            <Modal visible={modalAbonoVisible} transparent animationType="fade" onRequestClose={() => setModalAbonoVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalFondo}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalAbonoVisible(false)} />
                    <View style={s.modalCard}>
                        <Text style={s.modalTitulo}>Registrar Abono</Text>
                        <View style={s.pickerWrap}>
                            <Picker selectedValue={monedaAbono} onValueChange={setMonedaAbono}>
                                <Picker.Item label="Dólares (USD)" value="usd" />
                                <Picker.Item label="Bolívares (Bs)" value="bs" />
                            </Picker>
                        </View>
                        <View style={s.pickerWrap}>
                            <Picker selectedValue={metodoPago} onValueChange={setMetodoPago}>
                                <Picker.Item label="Efectivo" value="efectivo" />
                                <Picker.Item label="Transferencia" value="transferencia" />
                                <Picker.Item label="Punto de Venta" value="punto" />
                            </Picker>
                        </View>
                        <TextInput
                            style={s.modalInput}
                            placeholder={`Monto en ${monedaAbono === 'usd' ? 'USD' : 'Bs'}`}
                            keyboardType="numeric"
                            value={montoAbonar}
                            onChangeText={setMontoAbonar}
                            placeholderTextColor="#bbb"
                        />
                        <View style={s.modalBotones}>
                            <TouchableOpacity onPress={() => setModalAbonoVisible(false)}>
                                <Text style={s.cancelarTxt}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.aceptarBtn} onPress={handleAbonar}>
                                <Text style={s.aceptarTxt}>Confirmar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* ── Modal Agregar Platillo ── */}
            <Modal visible={selectorVisible} transparent animationType="fade" onRequestClose={() => setSelectorVisible(false)}>
                <View style={s.modalFondo}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectorVisible(false)} />
                    <View style={s.modalCard}>
                        <Text style={s.modalTitulo}>Agregar Platillo</Text>
                        <View style={s.pickerWrap}>
                            <Picker selectedValue={platilloSeleccionado} onValueChange={setPlatilloSeleccionado}>
                                {menuDisponible.map(p => (
                                    <Picker.Item key={p.id} label={`${p.nombre}  ·  $${p.precio_usd?.toFixed(2)}`} value={p.id} />
                                ))}
                            </Picker>
                        </View>
                        <View style={s.modalBotones}>
                            <TouchableOpacity onPress={() => setSelectorVisible(false)}>
                                <Text style={s.cancelarTxt}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.aceptarBtn} onPress={agregarPlatillo}>
                                <Text style={s.aceptarTxt}>Agregar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

// ── Estilos ────────────────────────────────────────────────────────
const RED = '#c21c1c';
const s   = StyleSheet.create({
    safeArea:      { flex: 1, backgroundColor: '#f7f7f9' },
    loadingWrap:   { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f7f9' },
    loadingText:   { marginTop: 12, color: '#888', fontSize: 14 },

    // Header
    header: {
        backgroundColor: RED,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: (StatusBar.currentHeight ?? 24) + 14,
        paddingBottom: 18,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 8,
        shadowColor: RED,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    backBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    headerNombre:  { fontSize: 20, fontWeight: '800', color: '#fff' },
    headerDir:     { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    estadoBadge:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, overflow: 'hidden' },
    estadoTexto:   { color: '#fff', fontWeight: '700', fontSize: 11, letterSpacing: 0.8 },

    // Resumen
    resumenCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 14,
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingVertical: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
    },
    resumenFila:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
    resumenDivider:      { height: 1, backgroundColor: '#f0f0f0' },
    resumenLabel:        { fontSize: 14, color: '#888', fontWeight: '500' },
    resumenValorPrincipal:{ fontSize: 18, fontWeight: '800', color: '#111' },
    resumenValorSec:     { fontSize: 12, color: '#aaa', textAlign: 'right' },
    resumenPagado:       { fontSize: 16, fontWeight: '700', color: '#1e8c3a' },
    resumenPendiente:    { fontSize: 16, fontWeight: '700', color: RED },
    resumenCambio:       { fontSize: 16, fontWeight: '700', color: '#1e8c3a' },

    // Lista
    listaWrap:  { flex: 1, marginTop: 12, paddingHorizontal: 16 },
    secLabel:   { fontSize: 11, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },

    // Items
    item: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 13,
        marginBottom: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
    },
    itemRow:       { flexDirection: 'row', alignItems: 'center' },
    itemNombre:    { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 2 },
    itemDetalle:   { fontSize: 12, color: '#999' },
    itemSubtotal:  { fontSize: 16, fontWeight: '800', color: RED },
    itemControles: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
    ctrlBtn:       { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    ctrlBtnDel:    { backgroundColor: '#fff0f0' },
    ctrlTxt:       { fontSize: 18, fontWeight: '700', color: '#333', lineHeight: 20 },
    ctrlCant:      { fontSize: 15, fontWeight: '800', color: '#111', minWidth: 22, textAlign: 'center' },

    // Barra acciones fija
    actionsBar: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        gap: 10,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    btnFila:    { flexDirection: 'row', gap: 10 },
    btnCompletar: {
        backgroundColor: '#111',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        elevation: 3,
    },
    btnAbonar: {
        flex: 1,
        backgroundColor: '#6c2aa8',
        borderRadius: 14,
        paddingVertical: 13,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#6c2aa8',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    btnAgregar: {
        flex: 1,
        backgroundColor: '#1565C0',
        borderRadius: 14,
        paddingVertical: 13,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#1565C0',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    btnGuardar: {
        backgroundColor: RED,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        elevation: 4,
        shadowColor: RED,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
    },
    btnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },

    // Modales
    modalFondo:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    modalCard:    { backgroundColor: '#fff', borderRadius: 22, padding: 22, width: '100%', elevation: 12 },
    modalTitulo:  { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 16 },
    pickerWrap:   { backgroundColor: '#f5f5f5', borderRadius: 12, marginBottom: 12, borderWidth: 1.5, borderColor: '#eee', overflow: 'hidden' },
    modalInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 16,
        color: '#111',
        borderWidth: 1.5,
        borderColor: '#eee',
        marginBottom: 16,
    },
    modalBotones: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, alignItems: 'center' },
    cancelarTxt:  { color: '#999', fontWeight: '700', fontSize: 15, paddingVertical: 10 },
    aceptarBtn:   { backgroundColor: RED, paddingVertical: 10, paddingHorizontal: 22, borderRadius: 12 },
    aceptarTxt:   { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default PedidoDetalle;