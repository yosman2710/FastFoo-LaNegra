import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native'; 
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native';

// Importa tus servicios y utilidades
import { supabase } from '../utils/supabase.js'; 
import { obtenerPedidos, eliminarPedido } from '../services/orderServices.js'; 
import { styles } from '../styles/gestionPedidos.style.js'; // Asegúrate de que esta ruta sea correcta

const GestionPedidos = ({ navigation }) => {
    const [pedidos, setPedidos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // FUNCIÓN CENTRAL: Carga de pedidos con useCallback para eficiencia
    const cargarPedidos = useCallback(async () => {
        try {
            const data = await obtenerPedidos(); 
            
            // Mapeo: Aseguramos el estado, y aquí TOTAL y PAGADO ya deberían ser 0 si son null 
            // gracias al servicio obtenerPedidos.
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

    // 1. RECUPERAR DATOS AL ENFOCAR (Recarga al volver de crear/editar)
    useFocusEffect(
        useCallback(() => {
            cargarPedidos();
            return () => {}; 
        }, [cargarPedidos])
    );
    
    // 2. MANTENER TIEMPO REAL (Realtime para cambios externos)
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

    // Función de filtrado
    const filtrarPedidos = () => {
        return pedidos.filter(p =>
            (p.clientName?.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase())) ||
            p.id.includes(busqueda)
        );
    };

    // Función para eliminar
    const handleEliminarPedido = async (id) => {
        Alert.alert('¿Eliminar?', '¿Deseas eliminar este pedido de la nube?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await eliminarPedido(id); 
                        Alert.alert('✅ Éxito', 'Pedido eliminado. Sincronizando...');
                    } catch (error) {
                        console.error('Error al eliminar pedido:', error);
                        Alert.alert('Error', 'No se pudo eliminar el pedido de la nube.');
                    }
                }
            }
        ]);
    };

    // Función para color de estado
    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'pendiente': return '#e53935';
            case 'abonado': return '#fb8c00';
            case 'completado': return '#43a047';
            case 'cancelado': return '#757575';
            default: return '#000';
        }
    };

    // FUNCIÓN RENDER: Muestra cada ítem de pedido
    const renderItem = ({ item }) => {
        const totalUsd = Number(item.totalUsd ?? item.total_usd ?? 0).toFixed(2);
        const pagadoUsd = Number(item.pagadoUsd ?? item.monto_abonado_usd ?? 0).toFixed(2);

        return (
            <View style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.id}>#{item.id.substring(0, 8)}...</Text> 
                    <Text style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado) }]}>
                        {item.estado.toUpperCase()}
                    </Text>
                </View>

                <Text style={styles.nombre}>👤 {item.clientName || item.cliente_nombre}</Text>
                {/* SIN ASTERISCOS y valores numéricos garantizados */}
                <Text style={styles.total}>💰 Total: ${totalUsd}</Text>
                <Text style={styles.pagado}>🧾 Pagado: ${pagadoUsd}</Text>
                <Text style={styles.fecha}>📅 {new Date(item.created_at || item.createdAt).toLocaleDateString()}</Text>

                <View style={styles.acciones}>
                    <TouchableOpacity
                        style={styles.botonVer}
                        onPress={() => navigation.navigate('DetallePedido', { id: item.id })}
                    >
                        <Text style={styles.textoBoton}>Ver</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.botonEliminar}
                        onPress={() => handleEliminarPedido(item.id)}
                    >
                        <Text style={styles.textoBoton}>Eliminar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };
    
    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={{ marginTop: 10 }}>Cargando pedidos...</Text>
            </View>
        );
    }
    
    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>Mis Pedidos</Text>

            <TextInput
                style={styles.input}
                placeholder="Buscar pedidos..."
                value={busqueda}
                onChangeText={setBusqueda}
            />

            <FlatList
                data={filtrarPedidos()}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListEmptyComponent={() => (
                    <Text style={{ textAlign: 'center', marginTop: 20 }}>
                        No se encontraron pedidos.
                    </Text>
                )}
            />

            <TouchableOpacity
                style={styles.botonFlotante}
                onPress={() => navigation.navigate('CrearPedido')}
            >
                <Text style={styles.iconoFlotante}>＋</Text>
            </TouchableOpacity>
        </View>
    );
};

export default GestionPedidos;