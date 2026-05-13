import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { supabase } from '../utils/supabase.js';
import { obtenerPedidos, eliminarPedido } from '../services/orderServices.js';
import { styles } from '../styles/gestionPedidos.style.js';
import UserMenu from '../components/UserMenu.js';

const GestionPedidos = ({ navigation }) => {
    const [pedidos, setPedidos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const cargarPedidos = useCallback(async () => {
        try {
            const data = await obtenerPedidos();
            const actualizados = data.map(p => ({
                ...p,
                estado: p.estado || 'pendiente'
            }));
            setPedidos(actualizados.reverse());
        } catch (error) {
            console.error("Error al cargar pedidos:", error);
            Alert.alert("Error de Conexión", "No se pudieron cargar los pedidos desde la nube.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            cargarPedidos();
            return () => { };
        }, [cargarPedidos])
    );

    useEffect(() => {
        const subscription = supabase
            .channel('pedidos-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
                cargarPedidos();
            })
            .subscribe();
        return () => { supabase.removeChannel(subscription); };
    }, [cargarPedidos]);

    const filtrarPedidos = () => pedidos.filter(p =>
        (p.clientName?.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase())) ||
        p.id.includes(busqueda)
    );

    const handleEliminarPedido = async (id) => {
        Alert.alert('¿Eliminar?', '¿Deseas eliminar este pedido?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await eliminarPedido(id);
                        setPedidos(curr => curr.filter(p => p.id !== id));
                        Alert.alert('✅ Éxito', 'Pedido eliminado correctamente.');
                    } catch (error) {
                        cargarPedidos();
                        Alert.alert('Error', 'No se pudo eliminar el pedido.');
                    }
                }
            }
        ]);
    };

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'pendiente':   return '#e53935';
            case 'abonado':     return '#fb8c00';
            case 'completado':  return '#43a047';
            case 'cancelado':   return '#757575';
            default:            return '#000';
        }
    };

    const renderItem = ({ item }) => {
        const totalUsd      = Number(item.totalUsd ?? item.total_usd ?? 0);
        const pagadoUsd     = Number(item.pagadoUsd ?? item.monto_abonado_usd ?? 0);
        const saldoPendiente = (totalUsd - pagadoUsd).toFixed(2);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('DetallePedido', { id: item.id })}
                activeOpacity={0.75}
            >
                {/* Header: nombre + badge */}
                <View style={styles.cardHeader}>
                    <Text style={styles.nombre} numberOfLines={1}>
                        {item.clientName || item.cliente_nombre}
                    </Text>
                    <Text style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado) }]}>
                        {item.estado.toUpperCase()}
                    </Text>
                </View>

                {/* Total y fecha */}
                <View style={styles.infoRow}>
                    <Text style={styles.total}>💰 ${totalUsd.toFixed(2)}</Text>
                    <Text style={styles.fecha}>
                        {new Date(item.created_at || item.createdAt).toLocaleDateString()}
                    </Text>
                </View>

                {/* Pagado */}
                <Text style={styles.pagado}>Pagado: ${pagadoUsd.toFixed(2)}</Text>

                {/* Deuda */}
                {saldoPendiente > 0 && (
                    <Text style={styles.deudaPendiente}>Saldo pendiente: ${saldoPendiente}</Text>
                )}

                {/* Divider + Eliminar */}
                <View style={styles.divider} />
                <View style={styles.acciones}>
                    <TouchableOpacity
                        style={styles.botonEliminar}
                        onPress={(e) => { e.stopPropagation(); handleEliminarPedido(item.id); }}
                    >
                        <Text style={styles.textoBoton}>Eliminar</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#c21c1c" />
                <Text style={styles.loadingText}>Cargando pedidos…</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={[]}>

            {/* Header rojo con menú integrado */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.titulo}>Mis Pedidos</Text>
                    <Text style={styles.subtituloHeader}>
                        {filtrarPedidos().length} pedido{filtrarPedidos().length !== 1 ? 's' : ''}
                    </Text>
                </View>
                <UserMenu />
            </View>

            {/* Búsqueda */}
            <View style={styles.searchWrapper}>
                <Ionicons name="search-outline" size={18} color="#aaa" style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.input}
                    placeholder="Buscar por cliente o ID…"
                    value={busqueda}
                    onChangeText={setBusqueda}
                    placeholderTextColor="#bbb"
                />
            </View>

            {/* Contenedor relativo para la lista + FAB */}
            <View style={{ flex: 1 }}>
                <FlatList
                    data={filtrarPedidos()}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={52} color="#ddd" />
                            <Text style={styles.emptyText}>No se encontraron pedidos.</Text>
                        </View>
                    )}
                />

                {/* FAB */}
                <TouchableOpacity
                    style={styles.botonFlotante}
                    onPress={() => navigation.navigate('CrearPedido')}
                >
                    <Text style={styles.iconoFlotante}>＋</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default GestionPedidos;