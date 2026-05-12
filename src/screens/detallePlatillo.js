import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { obtenerPlatilloPorId, eliminarPlatillo } from '../services/dishService.js';

const DEFAULT_IMAGE = require('../../assets/default-dish.png');

const DetallePlatillo = ({ route, navigation }) => {
    const { id } = route.params;
    const [platillo, setPlatillo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const cargar = async () => {
            try {
                const data = await obtenerPlatilloPorId(id);
                setPlatillo(data);
            } catch (e) {
                Alert.alert('Error', 'No se pudo cargar el platillo.');
                navigation.goBack();
            } finally {
                setIsLoading(false);
            }
        };
        cargar();
    }, [id]);

    const handleEliminar = () => {
        Alert.alert(
            'Eliminar platillo',
            '¿Estás seguro? Esta acción es permanente.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await eliminarPlatillo(id);
                            Alert.alert('✅', 'Platillo eliminado.');
                            navigation.goBack();
                        } catch {
                            Alert.alert('Error', 'No se pudo eliminar el platillo.');
                        }
                    },
                },
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#c21c1c" />
            </View>
        );
    }

    if (!platillo) return null;

    return (
        <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
            <ScrollView bounces={false} contentContainerStyle={{ flexGrow: 1 }}>

                {/* Imagen hero */}
                <View style={styles.imageContainer}>
                    <Image
                        source={platillo.imagen_url ? { uri: platillo.imagen_url } : DEFAULT_IMAGE}
                        style={styles.image}
                        resizeMode="cover"
                        defaultSource={DEFAULT_IMAGE}
                    />
                    {/* Back button encima de la imagen */}
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>

                    {/* Badge de precio */}
                    <View style={styles.priceBadge}>
                        <Text style={styles.priceText}>
                            ${platillo.precio_usd ? Number(platillo.precio_usd).toFixed(2) : '—'}
                        </Text>
                    </View>
                </View>

                {/* Contenido */}
                <View style={styles.content}>
                    <Text style={styles.nombre}>{platillo.nombre}</Text>

                    {platillo.descripcion ? (
                        <>
                            <Text style={styles.sectionLabel}>Descripción</Text>
                            <Text style={styles.descripcion}>{platillo.descripcion}</Text>
                        </>
                    ) : (
                        <Text style={styles.sinDescripcion}>Sin descripción.</Text>
                    )}

                    {/* Fila de info */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoChip}>
                            <Ionicons name="pricetag-outline" size={16} color="#c21c1c" />
                            <Text style={styles.infoChipText}>
                                ${platillo.precio_usd ? Number(platillo.precio_usd).toFixed(2) : '—'}
                            </Text>
                        </View>
                        <View style={styles.infoChip}>
                            <Ionicons name="restaurant-outline" size={16} color="#c21c1c" />
                            <Text style={styles.infoChipText}>Platillo</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Barra de acciones pegada al fondo */}
            <View style={styles.actionsBar}>
                <TouchableOpacity
                    style={styles.btnEliminar}
                    onPress={handleEliminar}
                    activeOpacity={0.85}
                >
                    <Ionicons name="trash-outline" size={20} color="#f44336" />
                    <Text style={styles.btnEliminarText}>Eliminar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.btnEditar}
                    onPress={() => navigation.navigate('EditarPlatillo', { id })}
                    activeOpacity={0.85}
                >
                    <Ionicons name="pencil-outline" size={20} color="#fff" />
                    <Text style={styles.btnEditarText}>Editar Platillo</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f7f7f9',
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f7f7f9',
    },
    // ─── Imagen hero ───
    imageContainer: {
        width: '100%',
        height: 280,
        backgroundColor: '#e0e0e0',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    backBtn: {
        position: 'absolute',
        top: 48,
        left: 16,
        backgroundColor: 'rgba(0,0,0,0.45)',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    priceBadge: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: '#c21c1c',
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
        elevation: 5,
    },
    priceText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 18,
    },
    // ─── Contenido ───
    content: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        marginTop: -24,
        padding: 24,
        flex: 1,
        minHeight: 260,
    },
    nombre: {
        fontSize: 26,
        fontWeight: '800',
        color: '#111',
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#aaa',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
    },
    descripcion: {
        fontSize: 15,
        color: '#555',
        lineHeight: 22,
        marginBottom: 20,
    },
    sinDescripcion: {
        fontSize: 14,
        color: '#ccc',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    infoRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    infoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#fff5f5',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#ffd5d5',
    },
    infoChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    // ─── Barra de acciones ───
    actionsBar: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    btnEliminar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#f44336',
        backgroundColor: '#fff0f0',
    },
    btnEliminarText: {
        color: '#f44336',
        fontWeight: '700',
        fontSize: 15,
    },
    btnEditar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#c21c1c',
        elevation: 4,
        shadowColor: '#c21c1c',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
    },
    btnEditarText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});

export default DetallePlatillo;
