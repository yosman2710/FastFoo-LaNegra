import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator, // 🛑 Ya importado
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// 🛑 Importamos iconos (si usas Expo, puedes usar @expo/vector-icons, sino, instala react-native-vector-icons)
// Para simplificar, mantendré los emojis en el texto como lo tenías, pero el diseño mejora.

// Importa tus servicios y utilidades
import { supabase } from '../utils/supabase.js';
import { obtenerPedidos, eliminarPedido } from '../services/orderServices.js';
import { styles } from '../styles/gestionPedidos.style.js';

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

            // Revertir el orden para mostrar el más nuevo primero
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
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'pedidos' },
                () => {
                    cargarPedidos();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [cargarPedidos]);

    const filtrarPedidos = () => {
        return pedidos.filter(p =>
            (p.clientName?.toLowerCase().includes(busqueda.toLowerCase()) ||
                p.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase())) ||
            p.id.includes(busqueda)
        );
    };


    // Función para eliminar con actualización optimista
    const handleEliminarPedido = async (id) => {
        Alert.alert('¿Eliminar?', '¿Deseas eliminar este pedido de la nube?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    try {
                        // 1. Ejecutar la eliminación en Supabase
                        await eliminarPedido(id);

                        // 2. 🛑 ACTUALIZACIÓN INMEDIATA DEL ESTADO LOCAL
                        setPedidos(currentPedidos =>
                            currentPedidos.filter(p => p.id !== id)
                        );

                        Alert.alert('✅ Éxito', 'Pedido eliminado correctamente.');
                    } catch (error) {
                        // Si falla, podrías volver a cargar la lista para asegurar la consistencia:
                        cargarPedidos();
                        console.error('Error al eliminar pedido:', error);
                        Alert.alert('Error', 'No se pudo eliminar el pedido de la nube.');
                    }
                }
            }
        ]);
    };


    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'pendiente': return '#e53935'; // Rojo (Tu color de botón Eliminar es similar)
            case 'abonado': return '#fb8c00'; // Naranja
            case 'completado': return '#43a047'; // Verde
            case 'cancelado': return '#757575'; // Gris
            default: return '#000';
        }
    };

    // FUNCIÓN RENDER: Muestra cada ítem de pedido
    const renderItem = ({ item }) => {
        // Usamos la lógica de deuda resaltada que te pasé previamente
        const totalUsd = Number(item.totalUsd ?? item.total_usd ?? 0);
        const pagadoUsd = Number(item.pagadoUsd ?? item.monto_abonado_usd ?? 0);
        const saldoPendiente = (totalUsd - pagadoUsd).toFixed(2);
        const totalUsdFormatted = totalUsd.toFixed(2);
        const pagadoUsdFormatted = pagadoUsd.toFixed(2);

        // Función para navegar al detalle
        const handleVerDetalle = () => {
            navigation.navigate('DetallePedido', { id: item.id });
        };

        return (
            // 🛑 CAMBIO CLAVE: La tarjeta entera es el botón de "Ver"
            <TouchableOpacity
                style={styles.card}
                onPress={handleVerDetalle}
                activeOpacity={0.7} // Retroalimentación visual al presionar
            >

                {/* FILA 1: Nombre del Cliente y Estado (Header) */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                    <Text style={styles.nombre}>
                        {item.clientName || item.cliente_nombre}
                    </Text>
                    <Text style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado) }]}>
                        {item.estado.toUpperCase()}
                    </Text>
                </View>

                {/* FILA 2: Total y Fecha */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <View style={styles.infoContainer}>
                        <Text style={styles.total}>💰Total: ${totalUsdFormatted}</Text>
                    </View>
                    <View style={styles.infoContainer}>
                        <Text style={styles.fecha}>
                            📅{new Date(item.created_at || item.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {/* FILA 3: Monto Pagado */}
                <View style={styles.infoContainer}>
                    <Text style={styles.pagado}>Pagado: ${pagadoUsdFormatted}</Text>
                </View>

                {/* NUEVA FILA: Deuda Pendiente resaltada (si existe) */}
                {(saldoPendiente > 0) && (
                    <Text style={styles.deudaPendiente}>
                        Saldo Pendiente: ${saldoPendiente}
                    </Text>
                )}

                {/* FILA 4: Acciones (Solo queda Eliminar) */}
                <View style={styles.acciones}>
                    {/* Dejamos un espacio vacío para alinear el botón Eliminar a la derecha */}
                    <View style={{ flex: 1 }} />

                    <TouchableOpacity
                        style={styles.botonEliminar}
                        onPress={(e) => {
                            e.stopPropagation(); // Evita que la tarjeta se presione
                            handleEliminarPedido(item.id);
                        }}
                    >
                        <Text style={styles.textoBoton}>Eliminar</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            // 🛑 Usamos SafeAreaView para el estado de carga también
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#c21c1c" />
                <Text style={{ marginTop: 10, color: '#333' }}>Cargando pedidos...</Text>
            </SafeAreaView>
        );
    }

    return (
        // 🛑 Implementación final de SafeAreaView como contenedor principal
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Text style={styles.titulo}>Mis Pedidos</Text>

            <TextInput
                style={styles.input}
                placeholder="Buscar pedidos por cliente o ID..."
                value={busqueda}
                onChangeText={setBusqueda}
                placeholderTextColor="#777"
            />

            <FlatList
                data={filtrarPedidos()}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 100 }} // Espacio para el botón flotante
                ListEmptyComponent={() => (
                    <Text style={{ textAlign: 'center', marginTop: 30, color: '#777' }}>
                        No se encontraron pedidos.
                    </Text>
                )}
            />

            {/* Botón Flotante para crear */}
            <TouchableOpacity
                style={styles.botonFlotante}
                onPress={() => navigation.navigate('CrearPedido')}
            >
                <Text style={styles.iconoFlotante}>＋</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

export default GestionPedidos;