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
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator // Añadimos indicador de carga
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Importamos el cliente Supabase para la función Realtime
import { supabase } from '../utils/supabase.js';
import {
    obtenerPlatillos,
    buscarPlatilloPorNombre,
    eliminarPlatillo
} from '../services/dishService.js';

import { styles } from '../styles/gestionPlatillos.styles.js';

const DEFAULT_IMAGE = '../../assets/default-dish.png'; // Usar una URL pública o asegurar la ruta local

const GestionPlatillos = ({ navigation }) => {
    const [platillos, setPlatillos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Estado de carga
    const fetchData = useCallback(async (term) => {
        setIsLoading(true);
        try {
            let data;
            const searchTerm = term.trim();

            if (searchTerm === '') {
                data = await obtenerPlatillos();
            } else {
                data = await buscarPlatilloPorNombre(searchTerm);
            }

            setPlatillos(data);
            setError('');
        } catch (err) {
            setError('❌ Error al cargar/buscar los platillos.');
            console.error("Error en fetchData:", err);
        } finally {
            setIsLoading(false);
        }
    }, []); // Dependencias vacías, solo se crea una vez

    // ------------------------------------------------------------------
    // 1. CARGA DE DATOS PRINCIPAL (Al enfocar la pantalla) 
    // Esto asegura que la lista se actualice al volver de Crear/Editar
    // ------------------------------------------------------------------
    useFocusEffect(
        useCallback(() => {
            fetchData(busqueda);
        }, [busqueda, fetchData]) // Depende de busqueda y fetchData (que es estable)
    );

    // ------------------------------------------------------------------
    // 2. REALTIME (Recarga cuando hay cambios en la base de datos) 📢
    // ------------------------------------------------------------------
    useEffect(() => {
        const subscription = supabase
            .channel('platillos-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'platillos' },
                () => {
                    // Recargamos los datos manteniendo el término de búsqueda actual
                    console.log('Cambio en Platillos detectado, recargando...');
                    fetchData(busqueda);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [busqueda, fetchData]); // Depende de busqueda y fetchData

    // ------------------------------------------------------------------
    // 3. BÚSQUEDA CON DEBOUNCE (Optimiza la consulta en Supabase)
    // ------------------------------------------------------------------
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            // Ya no llamamos a fetchData aquí, useFocusEffect lo manejará al cambiar busqueda
            // Sin embargo, mantenemos la estructura para un control más fino si fuera necesario.
            // Si quieres que la búsqueda sea inmediata al escribir, puedes eliminar este useEffect
            // y depender únicamente de useFocusEffect, pero el debounce es mejor para el rendimiento.
            if (busqueda.trim() !== '') {
                fetchData(busqueda);
            } else if (platillos.length === 0 && !isLoading) {
                // Si borra el texto de búsqueda y la lista está vacía, recarga todos
                fetchData('');
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [busqueda]);

    // ------------------------------------------------------------------
    // MANEJADOR DE ELIMINACIÓN
    // ------------------------------------------------------------------
    const handleEliminar = async (id) => {
        Alert.alert(
            "Confirmar Eliminación",
            "¿Estás seguro de que quieres eliminar este platillo? Esta acción es permanente.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    onPress: async () => {
                        try {
                            await eliminarPlatillo(id);
                            Alert.alert('✅', 'Platillo eliminado.');
                            // Realtime (useEffect) se encargará de actualizar la lista
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

    // ------------------------------------------------------------------
    // RENDERIZADO DEL ITEM DE LA LISTA
    // ------------------------------------------------------------------
    const renderPlatillo = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.filaPlatillo}>
                <Image
                    // Intentamos usar la URL, si falla, usamos la imagen local por defecto
                    source={{ uri: item.imagen_url }}
                    style={styles.imagenPlatillo}
                    defaultSource={require(DEFAULT_IMAGE)} // Usar defaultSource para la imagen local
                    onError={() => console.log('Error cargando imagen:', item.imagen_url)}
                />
                <View style={styles.infoPlatillo}>
                    <Text style={styles.nombrePlatillo} numberOfLines={1}>{item.nombre}</Text>
                    <Text style={styles.precioPlatillo}>
                        Precio: {item.precio_usd ? `$${Number(item.precio_usd).toFixed(2)}` : 'N/A'}
                    </Text>
                    <Text style={styles.descripcionPlatillo} numberOfLines={2}>
                        {item.descripcion}
                    </Text>
                </View>
            </View>

            <View style={styles.botonesFila}>
                <TouchableOpacity
                    style={[styles.botonAccion, styles.botonEditar]}
                    onPress={() => navigation.navigate('EditarPlatillo', { id: item.id })}
                >
                    <Text style={styles.textoBoton}>✏️ Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.botonAccion, styles.botonEliminar]}
                    onPress={() => handleEliminar(item.id)}
                >
                    <Text style={styles.textoBoton}>🗑️ Eliminar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // ------------------------------------------------------------------
    // RENDERIZADO PRINCIPAL
    // ------------------------------------------------------------------
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffe6ea' }} edges={['top', 'left', 'right']}>
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

                    {/* INDICADOR DE CARGA */}
                    {isLoading && <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 20 }} />}

                    {/* MENSAJE DE LISTA VACÍA */}
                    {!isLoading && platillos.length === 0 ? (
                        <Text style={styles.mensajeVacio}>
                            {busqueda.trim() !== ''
                                ? `No hay platillos que coincidan con "${busqueda}"`
                                : 'No se encontraron platillos. ¡Crea uno nuevo!'}
                        </Text>
                    ) : (
                        <FlatList
                            data={platillos}
                            keyExtractor={(item) => item.id}
                            renderItem={renderPlatillo}
                            contentContainerStyle={{ paddingBottom: 80 }}
                        />
                    )}

                    {/* BOTÓN FLOTANTE */}
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