import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Picker } from '@react-native-picker/picker';
import { decode } from 'base64-arraybuffer';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { obtenerPlatilloPorId, actualizarPlatillo } from '../services/dishService.js';
import { obtenerTasaDolar } from '../services/configService.js';
import { supabase } from '../utils/supabase.js';
import { styles } from '../styles/crearPlatillos.styles.js';

const BUCKET_NAME       = 'imagenes-platillos';
const DEFAULT_IMAGE_LOCAL = require('../../assets/default-dish.png');

const uploadAndGetUrl = async (uri) => {
    const base64      = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const fileExt     = uri.split('.').pop().toLowerCase() || 'jpeg';
    const mimeType    = fileExt === 'png' ? 'image/png' : 'image/jpeg';
    const filePath    = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const arrayBuffer = decode(base64);

    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, arrayBuffer, { contentType: mimeType, upsert: false });

    if (uploadError) throw new Error(`Fallo: ${uploadError.message}`);

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return data.publicUrl;
};

const EditarPlatillos = ({ route, navigation }) => {
    const { id } = route.params;

    const [platillo,    setPlatillo]    = useState(null);
    const [nombre,      setNombre]      = useState('');
    const [monto,       setMonto]       = useState('');
    const [moneda,      setMoneda]      = useState('usd');
    const [descripcion, setDescripcion] = useState('');
    const [imagenUri,   setImagenUri]   = useState('');
    const [imagenAsset, setImagenAsset] = useState(null);
    const [tasa,        setTasa]        = useState(null);
    const [isLoading,   setIsLoading]   = useState(true);
    const [isSaving,    setIsSaving]    = useState(false);

    useEffect(() => {
        const cargar = async () => {
            try {
                const datos          = await obtenerPlatilloPorId(id);
                if (!datos) throw new Error('Platillo no encontrado.');
                const tasaStr        = await obtenerTasaDolar();
                const tasaValor      = Number(tasaStr) || null;

                setPlatillo(datos);
                setNombre(datos.nombre);
                setDescripcion(datos.descripcion || '');
                setTasa(tasaValor);
                if (datos.precio_usd != null) {
                    setMoneda('usd');
                    setMonto(Number(datos.precio_usd).toFixed(2));
                }
                setImagenUri(datos.imagen_url || '');
            } catch (e) {
                Alert.alert('Error', e.message);
                navigation.goBack();
            } finally {
                setIsLoading(false);
            }
        };
        cargar();
    }, [id]);

    const seleccionarImagen = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permiso denegado'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });
        if (!result.canceled && result.assets?.length > 0) {
            setImagenAsset(result.assets[0]);
            setImagenUri(result.assets[0].uri);
        }
    };

    const handleGuardar = async () => {
        setIsSaving(true);
        const montoNum = Number(monto);
        if (!nombre.trim()) { Alert.alert('Error', 'El nombre es obligatorio.'); setIsSaving(false); return; }
        if (isNaN(montoNum) || montoNum <= 0) { Alert.alert('Error', 'Precio inválido.'); setIsSaving(false); return; }
        if (moneda === 'bs' && !tasa) { Alert.alert('Error', 'Sin tasa. Usa USD.'); setIsSaving(false); return; }

        const precioUsd       = moneda === 'usd' ? montoNum : parseFloat((montoNum / (tasa || 1)).toFixed(2));
        let imagenUrlGuardada = platillo.imagen_url;

        if (imagenAsset) {
            try { imagenUrlGuardada = await uploadAndGetUrl(imagenAsset.uri); }
            catch (e) { Alert.alert('Error', 'No se pudo subir la imagen. Se guardan los datos de texto.'); }
        }

        try {
            await actualizarPlatillo(id, {
                nombre:      nombre.trim(),
                precio_usd:  precioUsd,
                descripcion: descripcion.trim(),
                imagen_url:  imagenUrlGuardada,
            });
            Alert.alert('✅', 'Platillo actualizado.');
            navigation.goBack();
        } catch (e) {
            Alert.alert('Error', 'No se pudo actualizar el platillo.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !platillo) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f7f9' }}>
                <ActivityIndicator size="large" color="#c21c1c" />
                <Text style={{ marginTop: 12, color: '#888' }}>Cargando platillo…</Text>
            </View>
        );
    }

    const montoBase     = Number(monto) || 0;
    const tasaActual    = Number(tasa)  || 0;
    const precioUsdCalc = moneda === 'usd' ? montoBase : (montoBase / (tasaActual || 1));
    const precioBsCalc  = moneda === 'bs'  ? montoBase : (montoBase * tasaActual);
    const imageSrc      = imagenUri
        ? { uri: imagenUri }
        : DEFAULT_IMAGE_LOCAL;

    return (
        <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Header ── */}
                    <View style={styles.headerBlock}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={20} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerTexts}>
                            <Text style={styles.headerTitulo}>Editar Platillo</Text>
                            <Text style={styles.headerSubtitulo} numberOfLines={1}>{platillo.nombre}</Text>
                        </View>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleGuardar} disabled={isSaving}>
                            {isSaving
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Text style={styles.saveBtnText}>✔ Guardar</Text>
                            }
                        </TouchableOpacity>
                    </View>

                    {/* ── Precios ── */}
                    <View style={styles.preciosCard}>
                        <View style={styles.precioChip}>
                            <Text style={styles.precioChipLabel}>USD</Text>
                            <Text style={styles.precioChipValor}>${precioUsdCalc.toFixed(2)}</Text>
                        </View>
                        <View style={styles.precioChipDivider} />
                        <View style={styles.precioChip}>
                            <Text style={styles.precioChipLabel}>Bolívares</Text>
                            <Text style={styles.precioChipValor}>
                                {tasaActual > 0 ? `Bs ${precioBsCalc.toFixed(2)}` : '—'}
                            </Text>
                        </View>
                    </View>

                    {/* ── Nombre ── */}
                    <Text style={styles.seccionLabel}>Nombre del platillo</Text>
                    <View style={styles.fieldCard}>
                        <TextInput
                            style={styles.fieldInput}
                            placeholder="Nombre"
                            placeholderTextColor="#ccc"
                            value={nombre}
                            onChangeText={setNombre}
                        />
                    </View>

                    {/* ── Moneda ── */}
                    <Text style={styles.seccionLabel}>Moneda</Text>
                    <View style={styles.fieldCard}>
                        <Picker
                            style={styles.picker}
                            selectedValue={moneda}
                            onValueChange={setMoneda}
                            enabled={tasaActual > 0}
                        >
                            <Picker.Item label="Dólares (USD)" value="usd" />
                            <Picker.Item label="Bolívares (Bs)" value="bs" />
                        </Picker>
                    </View>

                    {/* ── Precio ── */}
                    <Text style={styles.seccionLabel}>Precio en {moneda === 'usd' ? 'USD' : 'Bs'}</Text>
                    <View style={styles.fieldCard}>
                        <TextInput
                            style={styles.fieldInput}
                            keyboardType="numeric"
                            placeholder={moneda === 'usd' ? 'Ej: 4.50' : 'Ej: 180.00'}
                            placeholderTextColor="#ccc"
                            value={monto}
                            onChangeText={(t) => setMonto(t.replace(/[^0-9.]/g, ''))}
                        />
                    </View>

                    {/* ── Descripción ── */}
                    <Text style={styles.seccionLabel}>Descripción (opcional)</Text>
                    <View style={styles.fieldCard}>
                        <TextInput
                            style={styles.fieldInputMultiline}
                            multiline
                            placeholder="Agrega una descripción…"
                            placeholderTextColor="#ccc"
                            value={descripcion}
                            onChangeText={setDescripcion}
                        />
                    </View>

                    {/* ── Imagen ── */}
                    <Text style={styles.seccionLabel}>Imagen del platillo</Text>
                    <TouchableOpacity style={styles.imageWrapper} onPress={seleccionarImagen} activeOpacity={0.9}>
                        <Image source={imageSrc} style={styles.imageFullCover} resizeMode="cover" />
                        <View style={styles.imageOverlay}>
                            <Ionicons name="camera-outline" size={18} color="#fff" />
                            <Text style={styles.imageOverlayText}>
                                {imagenAsset ? 'Cambiar imagen' : 'Toca para cambiar imagen'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default EditarPlatillos;