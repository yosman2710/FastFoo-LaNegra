import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Picker } from '@react-native-picker/picker';
import { decode } from 'base64-arraybuffer';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { insertarPlatillo } from '../services/dishService.js';
import { obtenerTasaDolar } from '../services/configService.js';
import { supabase } from '../utils/supabase.js';
import { styles } from '../styles/crearPlatillos.styles.js';

const DEFAULT_IMAGE_LOCAL = require('../../assets/default-dish.png');
const DEFAULT_IMAGE_URI   = Image.resolveAssetSource(DEFAULT_IMAGE_LOCAL).uri;
const BUCKET_NAME         = 'imagenes-platillos';

const uploadAndGetUrl = async (uri) => {
    const base64     = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const fileExt    = uri.split('.').pop().toLowerCase() || 'jpeg';
    const mimeType   = fileExt === 'png' ? 'image/png' : 'image/jpeg';
    const filePath   = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const arrayBuffer = decode(base64);

    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, arrayBuffer, { contentType: mimeType, upsert: false });

    if (uploadError) throw new Error(`Fallo de Supabase: ${uploadError.message}`);

    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return publicUrlData.publicUrl;
};

const CrearPlatillo = ({ navigation }) => {
    const [nombre,      setNombre]      = useState('');
    const [monto,       setMonto]       = useState('');
    const [moneda,      setMoneda]      = useState('usd');
    const [descripcion, setDescripcion] = useState('');
    const [imagenAsset, setImagenAsset] = useState(null);
    const [imagenUri,   setImagenUri]   = useState(DEFAULT_IMAGE_URI);
    const [tasa,        setTasa]        = useState(null);
    const [isSaving,    setIsSaving]    = useState(false);

    useEffect(() => {
        obtenerTasaDolar()
            .then(v => setTasa(Number(v) || null))
            .catch(() => Alert.alert('Advertencia', 'No se pudo cargar la tasa de cambio.'));
    }, []);

    const seleccionarImagen = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso Denegado', 'Necesitamos acceso a tu galería.');
            return;
        }
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
        const montoNum = Number(monto.replace(/[^0-9.]/g, ''));
        if (!nombre.trim() || isNaN(montoNum) || montoNum <= 0) {
            Alert.alert('Error', 'Nombre y precio válido son obligatorios.');
            setIsSaving(false);
            return;
        }
        if (moneda === 'bs' && !tasa) {
            Alert.alert('Error', 'Sin tasa de dólar. Guarda el precio en USD.');
            setIsSaving(false);
            return;
        }

        const precioUsd = moneda === 'usd' ? montoNum : parseFloat((montoNum / (tasa || 1)).toFixed(2));

        let imagenUrlGuardada = null;
        if (imagenAsset) {
            try {
                imagenUrlGuardada = await uploadAndGetUrl(imagenAsset.uri);
            } catch (e) {
                Alert.alert('Error de Subida', e.message);
                setIsSaving(false);
                return;
            }
        }

        try {
            await insertarPlatillo({
                nombre:      nombre.trim(),
                precio_usd:  precioUsd,
                descripcion: descripcion.trim(),
                imagen_url:  imagenUrlGuardada,
            });
            Alert.alert('✅', 'Platillo guardado exitosamente.');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'No se pudo guardar el platillo.');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const montoBase    = Number(monto) || 0;
    const tasaActual   = Number(tasa)  || 0;
    const precioUsdCalc = moneda === 'usd' ? montoBase : (montoBase / (tasaActual || 1));
    const precioBsCalc  = moneda === 'bs'  ? montoBase : (montoBase * tasaActual);
    const imageSrc      = imagenUri === DEFAULT_IMAGE_URI ? DEFAULT_IMAGE_LOCAL : { uri: imagenUri };

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
                            <Text style={styles.headerTitulo}>Nuevo Platillo</Text>
                            <Text style={styles.headerSubtitulo}>Completa los campos y guarda</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.saveBtn}
                            onPress={handleGuardar}
                            disabled={isSaving}
                        >
                            {isSaving
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Text style={styles.saveBtnText}>✔ Guardar</Text>
                            }
                        </TouchableOpacity>
                    </View>

                    {/* ── Precios calculados ── */}
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
                            placeholder="Ej: Arepas con pollo"
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
                            placeholder="Ej: Pollo asado, arroz, ensalada…"
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
                                {imagenUri === DEFAULT_IMAGE_URI ? 'Toca para seleccionar imagen' : 'Cambiar imagen'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default CrearPlatillo;