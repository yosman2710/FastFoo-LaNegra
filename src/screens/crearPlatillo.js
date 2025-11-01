import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Picker } from '@react-native-picker/picker';

// 🛑 LIBRERÍA DE EXPO PARA MANEJO DE ARCHIVOS LOCALES (Solución al error de 'path')
import * as FileSystem from 'expo-file-system';

// Importamos servicios de Supabase:
import { insertarPlatillo } from '../services/dishService.js';
import { obtenerTasaDolar } from '../services/configService.js';
import { supabase } from '../utils/supabase.js';

// Importa tus estilos (asegúrate de que este archivo exista)
import { styles } from '../styles/crearPlatillos.styles.js';

const DEFAULT_IMAGE_LOCAL = require('../../assets/default-dish.png');
const DEFAULT_IMAGE_URI = Image.resolveAssetSource(DEFAULT_IMAGE_LOCAL).uri; 
const BUCKET_NAME = 'imagenes-platillos'; 

// -----------------------------------------------------------------
// FUNCIÓN AUXILIAR: SUBIR IMAGEN (USANDO EXPO FILE SYSTEM Y BASE64)
// -----------------------------------------------------------------
const uploadAndGetUrl = async (uri, fileName, assetType) => {
    
    // 1. Determinar el Content Type
    // Usamos el type del asset como primera opción o 'image/jpeg' como fallback.
    const safeContentType = assetType || 'image/jpeg';
    
    // 2. Leer el archivo local como Base64 (Método seguro para Expo)
    let base64Data;
    try {
        base64Data = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });
    } catch (readError) {
        console.error('Error Expo FileSystem al leer archivo:', readError);
        throw new Error('No se pudo leer la imagen seleccionada del dispositivo.');
    }
    
    // 3. Convertir Base64 a Blob (necesario para la API de Supabase Storage)
    const blob = await new Promise((resolve, reject) => {
        // La función atob() está disponible en React Native y decodifica Base64.
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        resolve(new Blob([byteArray], { type: safeContentType }));
    });
    
    // 4. Generar la ruta y Subir el Blob a Supabase
    const filePath = `${Date.now()}_${fileName}`;
    
    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME) 
        .upload(filePath, blob, {
            contentType: safeContentType,
            upsert: false
        });

    if (uploadError) {
        console.error('Error Detallado de Subida a Supabase:', uploadError);
        throw new Error('Fallo en la subida a Supabase. Revisa las políticas o el log.');
    }
    
    // 5. Obtener la URL pública
    const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
};

// -----------------------------------------------------------------
// COMPONENTE CREARPLATILLO
// -----------------------------------------------------------------
const CrearPlatillo = ({ navigation }) => {
    const [nombre, setNombre] = useState('');
    const [monto, setMonto] = useState('');
    const [moneda, setMoneda] = useState('usd');
    const [descripcion, setDescripcion] = useState('');
    const [imagenAsset, setImagenAsset] = useState(null); 
    const [imagenUri, setImagenUri] = useState(DEFAULT_IMAGE_URI);
    const [tasa, setTasa] = useState(null);
    const [isSaving, setIsSaving] = useState(false); // Estado para evitar doble submit

    useEffect(() => {
        const cargarTasa = async () => {
            try {
                const valorString = await obtenerTasaDolar();
                const tasaValor = Number(valorString) || null;
                setTasa(tasaValor);
                
                if (!tasaValor) {
                    Alert.alert('Advertencia', 'No se pudo obtener la tasa de cambio. La opción Bs puede no funcionar.');
                }
            } catch (error) {
                 Alert.alert('Error', 'No se pudo cargar la tasa de dólar. Intente más tarde.');
            }
        };
        cargarTasa();
    }, []);

    const seleccionarImagen = async () => {
        const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.6 });
        if (result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            setImagenAsset(asset); 
            setImagenUri(asset.uri); 
        }
    };

    const handleGuardar = async () => {
        setIsSaving(true);
        // Limpieza de input para asegurar un número válido
        const montoNum = Number(monto.replace(/[^0-9.]/g, '')); 
        
        // --- VALIDACIONES DE DATOS ---
        if (!nombre.trim() || isNaN(montoNum) || montoNum <= 0) {
            Alert.alert('Error', 'Nombre y precio válido son obligatorios.');
            setIsSaving(false);
            return;
        }
        if (moneda === 'bs' && !tasa) {
             Alert.alert('Error', 'No se ha podido obtener la tasa de dólar. Guarde el precio en USD.');
             setIsSaving(false);
             return;
        }

        // 1. Determinar el precio base en USD
        const precioUsd = moneda === 'usd' 
            ? montoNum 
            : parseFloat((montoNum / (tasa || 1)).toFixed(2));
        
        // 2. Subir imagen (si fue seleccionada)
        let imagenUrlGuardada = null;
        if (imagenAsset) {
            try {
                imagenUrlGuardada = await uploadAndGetUrl(
                    imagenAsset.uri, 
                    imagenAsset.fileName || `imagen_${Date.now()}.jpg`,
                    imagenAsset.type 
                );
            } catch (e) {
                // Muestra el mensaje de error específico de la función auxiliar
                Alert.alert('Error de Subida', e.message); 
                setIsSaving(false);
                return;
            }
        }
        
        // 3. Preparar e Insertar el platillo
        const nuevoPlatillo = {
            nombre: nombre.trim(),
            precio_usd: precioUsd, 
            descripcion: descripcion.trim(),
            imagen_url: imagenUrlGuardada
        };

        try {
            await insertarPlatillo(nuevoPlatillo); 
            
            Alert.alert('✅', 'Platillo guardado exitosamente.');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'No se pudo guardar el platillo en la base de datos.');
            console.error('Error al guardar platillo:', error);
        } finally {
            setIsSaving(false);
        }
    };
    
    // Cálculos de precios seguros para la interfaz
    const montoBase = Number(monto) || 0;
    const tasaActual = Number(tasa) || 0;
    
    const precioUsdCalculado = montoBase > 0 
        ? (moneda === 'usd' ? montoBase : (montoBase / (tasaActual || 1)))?.toFixed(2) || '...'
        : '0.00';
    
    const precioBsCalculado = montoBase > 0 
        ? (moneda === 'bs' ? montoBase : (montoBase * tasaActual))?.toFixed(2) || '...'
        : '0.00';

    const imageSource = imagenUri === DEFAULT_IMAGE_URI 
        ? DEFAULT_IMAGE_LOCAL 
        : { uri: imagenUri };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={[styles.container, { paddingBottom: 40 }]}
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableOpacity
                        style={styles.botonGuardarArribaDerecha}
                        onPress={handleGuardar}
                        disabled={isSaving}
                    >
                        <Text style={styles.textoBotonArribaDerecha}>
                            {isSaving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                '✔ Guardar'
                            )}
                        </Text>
                    </TouchableOpacity>

                    {/* Mostrar Precios Calculados */}
                    <View style={styles.resumenPrecios}>
                        <Text style={styles.resumenTexto}>USD (Guardado): ${precioUsdCalculado}</Text>
                        <Text style={styles.resumenTexto}>Bs (Estimado): Bs {precioBsCalculado}</Text>
                        {tasaActual === 0 && <Text style={{ color: 'red', marginTop: 5 }}>Tasa de cambio no disponible.</Text>}
                    </View>

                    <Text style={styles.label}>Nombre del Platillo</Text>
                    <TextInput
                        style={styles.input}
                        value={nombre}
                        onChangeText={setNombre}
                    />
                    
                    <Text style={styles.label}>Moneda del Precio</Text>
                    <Picker
                        selectedValue={moneda}
                        onValueChange={setMoneda}
                        style={styles.input}
                        enabled={tasaActual !== 0}
                    >
                        <Picker.Item label="Dólares (USD)" value="usd" />
                        <Picker.Item label="Bolívares (Bs)" value="bs" />
                    </Picker>

                    <Text style={styles.label}>Monto en {moneda === 'usd' ? 'USD' : 'Bs'}</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={monto}
                        onChangeText={(text) => setMonto(text.replace(/[^0-9.]/g, ''))}
                        placeholder={`Ej: ${moneda === 'usd' ? '4.50' : '180.00'}`}
                    />

                    <Text style={styles.label}>Descripción</Text>
                    <TextInput
                        style={[styles.input, { height: 80 }]}
                        multiline
                        value={descripcion}
                        onChangeText={setDescripcion}
                    />

                    <Text style={styles.label}>Imagen del Platillo</Text>
                    <TouchableOpacity style={styles.imageContainer} onPress={seleccionarImagen}>
                        <Image
                            source={imageSource} 
                            style={{ width: '100%', height: '100%', borderRadius: 10 }}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default CrearPlatillo;