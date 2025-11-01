import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    FlatList,
    Text,
    TextInput,
    Alert,
    Image,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';

// Importamos el cliente Supabase para la función Realtime
import { supabase } from '../utils/supabase.js'; 
import {
    obtenerPlatillos,
    buscarPlatilloPorNombre,
    eliminarPlatillo
} from '../services/dishService.js'; // Usamos el nombre correcto

import { styles } from '../styles/gestionPlatillos.styles.js';

const DEFAULT_IMAGE = '../../assets/default-dish.png'; // Asegúrate de que esta ruta sea correcta

const GestionPlatillos = ({ navigation }) => {
    const [platillos, setPlatillos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [error, setError] = useState('');
    
    // Usamos esta función para obtener los datos, ya sea por carga inicial o por búsqueda
    const fetchData = async (term = busqueda) => {
        try {
            let data;
            if (term.trim() === '') {
                data = await obtenerPlatillos(); // Obtiene todos
            } else {
                data = await buscarPlatilloPorNombre(term); // Obtiene filtrados
            }
            setPlatillos(data);
            setError('');
        } catch (err) {
            setError('❌ Error al cargar/buscar los platillos');
            console.error(err);
        }
    };

    // 1. Efecto para la Carga Inicial y Realtime 📢
    useEffect(() => {
        // Carga inicial de datos
        fetchData(); 

        // Suscripción a cambios en la tabla 'platillos'
        const subscription = supabase
            .channel('platillos-channel') // Nombre único para el canal
            .on(
                'postgres_changes', 
                { event: '*', schema: 'public', table: 'platillos' },
                (payload) => {
                    // Cuando ocurre un cambio (INSERT, UPDATE, DELETE), volvemos a cargar los datos
                    console.log('Cambio en Platillos detectado:', payload.eventType);
                    fetchData(); 
                }
            )
            .subscribe();

        // Limpieza de la suscripción al desmontar el componente
        return () => {
            supabase.removeChannel(subscription);
        };
    }, []); 
    // NOTA: Con Realtime, useFocusEffect ya no es estrictamente necesario, pero lo mantendremos para
    // que funcione la carga de la búsqueda después de editar si el useEffect no se dispara.

    // 2. Efecto para la Búsqueda (Debounced)
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            // Llama a la función de búsqueda/carga con el término actual
            fetchData(busqueda);
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [busqueda]);
    // Nota: Eliminamos handleBuscar y usamos fetchData directamente.

    const handleEliminar = async (id) => {
        Alert.alert(
            "Confirmar Eliminación",
            "¿Estás seguro de que quieres eliminar este platillo? Esta acción es permanente.",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                { 
                    text: "Eliminar", 
                    onPress: async () => {
                        try {
                            // La función eliminarPlatillo usa el servicio de Supabase
                            await eliminarPlatillo(id); 
                            
                            // Ya no necesitamos llamar a fetchData() manualmente, 
                            // Realtime se encarga de recargar la lista
                            Alert.alert('✅', 'Platillo eliminado. La lista se actualizará instantáneamente.');

                        } catch (err) {
                            Alert.alert('Error', 'No se pudo eliminar el platillo de la nube.');
                            console.error(err);
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const renderPlatillo = ({ item }) => (
    <View style={styles.card}>
        <View style={styles.filaPlatillo}>
            <Image
                // Usa directamente el campo de la BD: imagen_url
                source={{ uri: item.imagen_url || DEFAULT_IMAGE }} 
                style={styles.imagenPlatillo}
            />
            <View style={styles.infoPlatillo}>
                <Text style={styles.nombrePlatillo}>{item.nombre}</Text>
                <Text style={styles.precioPlatillo}>
                    {/* Usa directamente el campo de la BD: precio_usd */}
                    Precio: {item.precio_usd ? `$${item.precio_usd.toFixed(2)}` : 'No disponible'} 
                </Text>
                <Text style={styles.descripcionPlatillo}>{item.descripcion}</Text>
            </View>
        </View>

        <View style={styles.botonesFila}>
            <TouchableOpacity
                style={[styles.botonAccion, styles.botonEditar]}
                onPress={() => navigation.navigate('EditarPlatillo', { id: item.id })}
            >
                <Text style={styles.textoBoton}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.botonAccion, styles.botonEliminar]}
                onPress={() => handleEliminar(item.id)}
            >
                <Text style={styles.textoBoton}>Eliminar</Text>
            </TouchableOpacity>
        </View>
    </View>
);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.container}>
                    <Text style={styles.titulo}>Gestión de Platillos</Text>

                    <TextInput
                        style={[styles.inputBuscar, { marginBottom: 20 }]}
                        placeholder="🔍 Buscar platillo por nombre..."
                        value={busqueda}
                        onChangeText={setBusqueda}
                    />

                    {error !== '' && <Text style={styles.error}>{error}</Text>}

                    {platillos.length === 0 ? (
                        <Text style={styles.mensajeVacio}>No se encontraron platillos</Text>
                    ) : (
                        <FlatList
                            data={platillos}
                            keyExtractor={(item) => item.id} // El ID de Supabase es string (UUID)
                            renderItem={renderPlatillo}
                            contentContainerStyle={{ paddingBottom: 80 }}
                        />
                    )}

                    <TouchableOpacity
                        style={styles.botonFlotante}
                        onPress={() => navigation.navigate('CrearPlatillo')}
                    >
                        <Text style={styles.iconoFlotante}>＋</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default GestionPlatillos;