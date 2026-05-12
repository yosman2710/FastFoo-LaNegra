import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { obtenerPlatillos }  from '../services/dishService.js';
import { guardarPedido }     from '../services/orderServices.js';
import { obtenerTasaDolar }  from '../services/configService.js';

const RED = '#c21c1c';

const CrearPedido = ({ navigation }) => {
    const [platillos,  setPlatillos]  = useState([]);
    const [cantidades, setCantidades] = useState({});
    const [cliente,    setCliente]    = useState('');
    const [busqueda,   setBusqueda]   = useState('');
    const [tasa,       setTasa]       = useState(null);
    const [isLoading,  setIsLoading]  = useState(true);
    const [isGuardando,setIsGuardando]= useState(false);

    useEffect(() => {
        const cargar = async () => {
            try {
                const data    = await obtenerPlatillos();
                const inicial = {};
                data.forEach(p => { inicial[p.id] = 0; });
                setPlatillos(data);
                setCantidades(inicial);
                const t = await obtenerTasaDolar();
                setTasa(parseFloat(t));
            } catch {
                Alert.alert('Error', 'No se pudieron cargar los datos.');
            } finally {
                setIsLoading(false);
            }
        };
        cargar();
    }, []);

    // ── Lógica ─────────────────────────────────────────────
    const incrementar = (id) => setCantidades(prev => ({ ...prev, [id]: prev[id] + 1 }));
    const decrementar = (id) => setCantidades(prev => ({ ...prev, [id]: Math.max(prev[id] - 1, 0) }));

    const calcularTotal = () => {
        if (!tasa) return { usd: '0.00', bs: '0.00' };
        let totalUsd = 0;
        platillos.forEach(p => { totalUsd += (cantidades[p.id] || 0) * (p.precio_usd || 0); });
        return { usd: totalUsd.toFixed(2), bs: (totalUsd * tasa).toFixed(2) };
    };

    const itemsSeleccionados = platillos.filter(p => (cantidades[p.id] || 0) > 0);

    const platillosFiltrados = busqueda.trim()
        ? platillos.filter(p => p.nombre?.toLowerCase().includes(busqueda.toLowerCase().trim()))
        : platillos;

    const confirmarPedido = async () => {
        if (!cliente.trim()) { Alert.alert('⚠️', 'Ingresa el nombre del cliente.'); return; }
        if (itemsSeleccionados.length === 0) { Alert.alert('⚠️', 'Selecciona al menos un platillo.'); return; }

        setIsGuardando(true);
        const total = calcularTotal();
        try {
            await guardarPedido({
                cliente_nombre: cliente.trim(),
                items: itemsSeleccionados.map(p => ({
                    id: p.id,
                    nombre: p.nombre,
                    precio_unitario_usd: p.precio_usd,
                    cantidad: cantidades[p.id],
                })),
                total_usd: parseFloat(total.usd),
            });
            Alert.alert('✅ Pedido creado', 'El pedido fue guardado en la nube.');
            navigation.goBack();
        } catch {
            Alert.alert('Error', 'No se pudo guardar el pedido.');
        } finally {
            setIsGuardando(false);
        }
    };

    // ── Render platillo ────────────────────────────────────
    const renderItem = ({ item }) => {
        const cant   = cantidades[item.id] || 0;
        const activo = cant > 0;
        const precioBs = tasa ? (item.precio_usd * tasa).toFixed(2) : '…';

        return (
            <View style={[s.item, activo && s.itemActivo]}>
                <View style={{ flex: 1 }}>
                    <Text style={s.itemNombre}>{item.nombre}</Text>
                    <Text style={s.itemPrecio}>
                        <Text style={s.itemPrecioUsd}>${Number(item.precio_usd).toFixed(2)}</Text>
                        {'  ·  '}
                        <Text style={s.itemPrecioBs}>Bs {precioBs}</Text>
                    </Text>
                </View>
                <View style={s.controles}>
                    <TouchableOpacity style={s.ctrlBtn} onPress={() => decrementar(item.id)}>
                        <Text style={s.ctrlTxt}>−</Text>
                    </TouchableOpacity>
                    <Text style={[s.ctrlCant, activo && s.ctrlCantActivo]}>{cant}</Text>
                    <TouchableOpacity style={[s.ctrlBtn, s.ctrlBtnAdd]} onPress={() => incrementar(item.id)}>
                        <Text style={[s.ctrlTxt, { color: '#fff' }]}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const total = calcularTotal();

    return (
        <SafeAreaView style={s.safeArea} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

                {/* ── Header rojo con back ── */}
                <View style={s.header}>
                    <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={20} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={s.headerTitulo}>Nuevo Pedido</Text>
                        <Text style={s.headerSub}>
                            {itemsSeleccionados.length > 0
                                ? `${itemsSeleccionados.length} platillo${itemsSeleccionados.length > 1 ? 's' : ''} seleccionado${itemsSeleccionados.length > 1 ? 's' : ''}`
                                : 'Selecciona los platillos'}
                        </Text>
                    </View>
                </View>

                {/* ── Campo cliente ── */}
                <View style={s.clienteWrap}>
                    <Ionicons name="person-outline" size={18} color="#aaa" style={{ marginRight: 10 }} />
                    <TextInput
                        style={s.clienteInput}
                        placeholder="Nombre del cliente…"
                        placeholderTextColor="#bbb"
                        value={cliente}
                        onChangeText={setCliente}
                    />
                </View>

                {/* ── Búsqueda ── */}
                <View style={s.searchWrap}>
                    <Ionicons name="search-outline" size={17} color="#aaa" style={{ marginRight: 8 }} />
                    <TextInput
                        style={s.searchInput}
                        placeholder="Buscar platillo…"
                        placeholderTextColor="#bbb"
                        value={busqueda}
                        onChangeText={setBusqueda}
                    />
                    {busqueda.length > 0 && (
                        <TouchableOpacity onPress={() => setBusqueda('')}>
                            <Ionicons name="close-circle" size={17} color="#ccc" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* ── Lista platillos ── */}
                {isLoading ? (
                    <ActivityIndicator size="large" color={RED} style={{ marginTop: 40 }} />
                ) : (
                    <FlatList
                        data={platillosFiltrados}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={s.listaContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={() => (
                            <View style={s.emptyWrap}>
                                <Ionicons name="restaurant-outline" size={44} color="#ddd" />
                                <Text style={s.emptyTxt}>
                                    {busqueda.trim() ? `Sin resultados para "${busqueda}"` : 'No hay platillos.'}
                                </Text>
                            </View>
                        )}
                    />
                )}

                {/* ── Barra de resumen + confirmar (fija abajo) ── */}
                <View style={s.bottomBar}>
                    <View style={s.resumenRow}>
                        <View>
                            <Text style={s.resumenLabel}>Total del pedido</Text>
                            <Text style={s.resumenValorBs}>Bs {total.bs}</Text>
                        </View>
                        <Text style={s.resumenValorUsd}>${total.usd}</Text>
                    </View>
                    <TouchableOpacity
                        style={[s.btnConfirmar, isGuardando && { opacity: 0.6 }]}
                        onPress={confirmarPedido}
                        disabled={isGuardando}
                        activeOpacity={0.85}
                    >
                        {isGuardando
                            ? <ActivityIndicator color="#fff" />
                            : <>
                                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={s.btnConfirmarTxt}>Confirmar Pedido</Text>
                            </>
                        }
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// ── Estilos ────────────────────────────────────────────────────────
const s = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f7f7f9' },

    // Header
    header: {
        backgroundColor: RED,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 14,
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
    headerTitulo:  { fontSize: 20, fontWeight: '800', color: '#fff' },
    headerSub:     { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

    // Cliente
    clienteWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 14,
        marginBottom: 8,
        borderRadius: 14,
        paddingHorizontal: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
    },
    clienteInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#111' },

    // Búsqueda
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 14,
        paddingHorizontal: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
    },
    searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#111' },

    // Lista
    listaContent: { paddingHorizontal: 16, paddingBottom: 8 },
    emptyWrap:    { alignItems: 'center', marginTop: 40 },
    emptyTxt:     { color: '#bbb', fontSize: 14, marginTop: 10 },

    // Items
    item: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    itemActivo:    { borderColor: RED, backgroundColor: '#fff9f9' },
    itemNombre:    { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 3 },
    itemPrecio:    { fontSize: 13 },
    itemPrecioUsd: { color: RED,   fontWeight: '700' },
    itemPrecioBs:  { color: '#888', fontWeight: '500' },

    // Controles cantidad
    controles: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 10 },
    ctrlBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ctrlBtnAdd:      { backgroundColor: RED },
    ctrlTxt:         { fontSize: 18, fontWeight: '700', color: '#444', lineHeight: 20 },
    ctrlCant:        { fontSize: 15, fontWeight: '700', color: '#ccc', minWidth: 22, textAlign: 'center' },
    ctrlCantActivo:  { color: '#111' },

    // Barra inferior fija
    bottomBar: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        elevation: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        gap: 12,
    },
    resumenRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    resumenLabel:    { fontSize: 12, color: '#aaa', fontWeight: '600', marginBottom: 2 },
    resumenValorBs:  { fontSize: 14, fontWeight: '700', color: '#555' },
    resumenValorUsd: { fontSize: 26, fontWeight: '800', color: RED },
    btnConfirmar: {
        backgroundColor: RED,
        borderRadius: 14,
        paddingVertical: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: RED,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
    },
    btnConfirmarTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default CrearPedido;