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
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { supabase } from '../utils/supabase.js';
import {
    obtenerPlatillos,
    buscarPlatilloPorNombre,
    eliminarPlatillo
} from '../services/dishService.js';
import { styles } from '../styles/gestionPlatillos.styles.js';
import UserMenu from '../components/UserMenu.js';

const DEFAULT_IMAGE = require('../../assets/default-dish.png');

const GestionPlatillos = ({ navigation }) => {
    const [platillos, setPlatillos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = useCallback(async (term) => {
        setIsLoading(true);
        try {
            const data = term.trim() === ''
                ? await obtenerPlatillos()
                : await buscarPlatilloPorNombre(term.trim());
            setPlatillos(data);
            setError('');
        } catch (err) {
            setError('Error al cargar los platillos.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => { fetchData(busqueda); }, [busqueda, fetchData])
    );

    useEffect(() => {
        const subscription = supabase
            .channel('platillos-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'platillos' }, () => {
                fetchData(busqueda);
            })
            .subscribe();
        return () => { supabase.removeChannel(subscription); };
    }, [busqueda, fetchData]);

    useEffect(() => {
        const t = setTimeout(() => {
            if (busqueda.trim() !== '') fetchData(busqueda);
            else if (platillos.length === 0 && !isLoading) fetchData('');
        }, 300);
        return () => clearTimeout(t);
    }, [busqueda]);

    const handleEliminar = async (id) => {
        Alert.alert(
            "Eliminar platillo",
            "¿Estás seguro? Esta acción es permanente.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await eliminarPlatillo(id);
                            Alert.alert('✅', 'Platillo eliminado.');
                        } catch (err) {
                            Alert.alert('Error', 'No se pudo eliminar el platillo.');
                        }
                    }
                }
            ]
        );
    };

    const renderPlatillo = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('DetallePlatillo', { id: item.id })}
            activeOpacity={0.75}
        >
            <View style={styles.filaPlatillo}>
                <Image
                    source={item.imagen_url ? { uri: item.imagen_url } : DEFAULT_IMAGE}
                    style={styles.imagenPlatillo}
                    defaultSource={DEFAULT_IMAGE}
                    onError={() => { }}
                />
                <View style={styles.infoPlatillo}>
                    <Text style={styles.nombrePlatillo} numberOfLines={1}>{item.nombre}</Text>
                    <Text style={styles.precioPlatillo}>
                        {item.precio_usd ? `$${Number(item.precio_usd).toFixed(2)}` : 'N/A'}
                    </Text>
                    <Text style={styles.descripcionPlatillo} numberOfLines={2}>
                        {item.descripcion}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" style={{ marginLeft: 4 }} />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={[]}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

                {/* Header rojo con menú integrado */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.titulo}>Platillos</Text>
                        <Text style={styles.subtituloHeader}>{platillos.length} en el menú</Text>
                    </View>
                    <UserMenu />
                </View>

                {/* Búsqueda */}
                <View style={styles.searchWrapper}>
                    <Ionicons name="search-outline" size={18} color="#aaa" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.inputBuscar}
                        placeholder="Buscar platillo…"
                        value={busqueda}
                        onChangeText={setBusqueda}
                        placeholderTextColor="#bbb"
                    />
                </View>

                {/* Contenedor relativo para lista + FAB */}
                <View style={{ flex: 1 }}>
                    {error !== '' && <Text style={styles.error}>{error}</Text>}

                    {isLoading ? (
                        <ActivityIndicator size="large" color="#c21c1c" style={{ marginTop: 40 }} />
                    ) : platillos.length === 0 ? (
                        <View style={{ alignItems: 'center', marginTop: 60 }}>
                            <Ionicons name="restaurant-outline" size={52} color="#ddd" />
                            <Text style={styles.mensajeVacio}>
                                {busqueda.trim() !== ''
                                    ? `Sin resultados para "${busqueda}"`
                                    : 'No hay platillos. ¡Crea uno!'}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={platillos}
                            keyExtractor={(item) => item.id}
                            renderItem={renderPlatillo}
                            contentContainerStyle={styles.listContent}
                        />
                    )}

                    {/* FAB */}
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