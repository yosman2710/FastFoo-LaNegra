import React, { useState, useEffect, useCallback } from 'react';
// ELIMINAMOS: import AsyncStorage from '@react-native-async-storage/async-storage'; 
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    Alert
} from 'react-native';


// Importamos el cliente Supabase para la función Realtime
import { supabase } from '../utils/supabase.js'; 

// Importamos servicios de Supabase (asumimos que ya están migrados)
import { obtenerPedidos, eliminarPedido } from '../services/orderServices.js'; 
import { styles } from '../styles/gestionPedidos.style.js';

const GestionPedidos = ({ navigation }) => {
    const [pedidos, setPedidos] = useState([]);
    const [busqueda, setBusqueda] = useState('');

    // Función para determinar el estado (lógica ya existente)
    const actualizarEstado = (pedido) => {
        // Usamos los campos que vienen de la BD, asumiendo snake_case o el mapeo
        const pagado = pedido.pagado_usd ?? pedido.pagadoUsd ?? 0;
        const total = pedido.total_usd ?? pedido.totalUsd ?? 0; 

        if (pagado === 0) return 'pendiente';
        if (pagado < total) return 'abonado';
        return 'completado';
    };

    // Función que se encarga de cargar y actualizar la lista de pedidos
    // Esta función será llamada por la suscripción Realtime
    const cargarPedidos = async () => {
        try {
            // La función 'obtenerPedidos' obtiene la data de Supabase
            const data = await obtenerPedidos(); 
            
            const actualizados = data.map(p => ({
                ...p,
                // totalUsd y pagadoUsd deben venir ya del servicio Supabase
                estado: actualizarEstado(p) 
            }));
            
            // Revertir el orden para mostrar el más nuevo primero
            setPedidos(actualizados.reverse()); 
            
        } catch (error) {
            console.error("Error al cargar pedidos:", error);
            Alert.alert("Error de Conexión", "No se pudieron cargar los pedidos desde la nube.");
        }
    };


    // 📢 IMPLEMENTACIÓN DE TIEMPO REAL (REALTIME)
    useEffect(() => {
        // 1. Carga inicial de datos al montar
        cargarPedidos(); 

        // 2. Suscripción a cambios en la tabla 'pedidos'
        const subscription = supabase
            .channel('pedidos-channel') // Nombre único para el canal
            .on(
                'postgres_changes', 
                { event: '*', schema: 'public', table: 'pedidos' },
                (payload) => {
                    // Cuando hay un cambio (INSERT, UPDATE, DELETE), recargar la lista
                    console.log('Cambio en Pedidos detectado:', payload.eventType);
                    cargarPedidos(); 
                }
            )
            .subscribe();

        // 3. Limpieza: Desuscribirse al desmontar el componente
        return () => {
            supabase.removeChannel(subscription);
        };
    }, []); // El array de dependencia vacío asegura que se ejecute solo una vez


    const filtrarPedidos = () => {
        // La búsqueda se hace sobre el estado actual, que se mantiene sincronizado por Realtime
        return pedidos.filter(p =>
            (p.clientName?.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase())) ||
            p.id.includes(busqueda)
        );
    };

    const handleEliminarPedido = async (id) => {
        Alert.alert('¿Eliminar?', '¿Deseas eliminar este pedido de la nube?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    try {
                        // Usamos la función de servicio Supabase
                        await eliminarPedido(id); 
                        // Realtime recargará automáticamente la lista.
                        Alert.alert('✅ Éxito', 'Pedido eliminado. Sincronizando...');
                    } catch (error) {
                        console.error('Error al eliminar pedido:', error);
                        Alert.alert('Error', 'No se pudo eliminar el pedido de la nube.');
                    }
                }
            }
        ]);
    };

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'pendiente': return '#e53935';
            case 'abonado': return '#fb8c00';
            case 'completado': return '#43a047';
            default: return '#000';
        }
    };

   const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Asumimos que el ID es un UUID/String */}
        <Text style={styles.id}>#{item.id.substring(0, 8)}...</Text> 
        <Text style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado) }]}>
          {item.estado.toUpperCase()}
        </Text>
      </View>

      {/* Usamos los campos mapeados (clientName, totalUsd) o los de la BD (cliente_nombre, total_usd) */}
      <Text style={styles.nombre}>👤 {item.clientName || item.cliente_nombre}</Text>
      <Text style={styles.total}>💰 Total: ${item.totalUsd?.toFixed(2) ?? item.total_usd?.toFixed(2)}</Text>
      <Text style={styles.pagado}>🧾 Pagado: ${item.pagadoUsd?.toFixed(2) ?? item.pagado_usd?.toFixed(2) ?? 0}</Text>
      <Text style={styles.fecha}>📅 {new Date(item.created_at || item.createdAt).toLocaleDateString()}</Text>

      <View style={styles.acciones}>
        <TouchableOpacity
          style={styles.botonVer}
          onPress={() => navigation.navigate('DetallePedido', { pedido: item })}
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

