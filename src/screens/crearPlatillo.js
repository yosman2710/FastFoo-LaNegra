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
    Platform
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
// ELIMINAMOS: import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { Picker } from '@react-native-picker/picker';

// Importamos las funciones de servicio actualizadas:
import { insertarPlatillo } from '../services/dishService.js'; // Usamos el nombre correcto
import { obtenerTasaDolar } from '../services/configService.js';
import { supabase } from '../utils/supabase.js'; // Importamos el cliente Supabase para el Storage

import { styles } from '../styles/crearPlatillos.styles.js';

// URL por defecto para manejar el estado de la imagen (debe coincidir con la de tu assets)
const DEFAULT_IMAGE = Image.resolveAssetSource(require('../../assets/default-dish.png')).uri;
const BUCKET_NAME = 'imagenes-platillos'; // ¡Asegúrate de que este sea el nombre de tu Bucket!

// -----------------------------------------------------------------
// FUNCIÓN AUXILIAR: SUBIR IMAGEN A SUPABASE STORAGE
// -----------------------------------------------------------------
const uploadAndGetUrl = async (uri, fileName, contentType) => {
    // 1. Convertir el archivo a formato Blob/Buffer (necesario para Supabase)
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // 2. Generar una ruta de archivo única
    const filePath = `${Date.now()}_${fileName}`;
    
    // 3. Subir el archivo
    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME) 
        .upload(filePath, blob, {
            contentType: contentType,
            upsert: false
        });

    if (uploadError) {
        console.error('Error de subida:', uploadError);
        throw new Error('Falló al subir la imagen al Storage.');
    }
    
    // 4. Obtener la URL pública
    const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
};

const CrearPlatillo = ({ navigation }) => {
    const [nombre, setNombre] = useState('');
    const [monto, setMonto] = useState('');
    const [moneda, setMoneda] = useState('usd');
    const [descripcion, setDescripcion] = useState('');
    const [imagenAsset, setImagenAsset] = useState(null); // Guardamos el objeto asset aquí
    const [imagenUri, setImagenUri] = useState(DEFAULT_IMAGE); // Guardamos la URI para la vista previa
    const [tasa, setTasa] = useState(null);

    useEffect(() => {
        const cargarTasa = async () => {
            try {
                // Cargar tasa desde Supabase
                const valorString = await obtenerTasaDolar();
                if (valorString) setTasa(parseFloat(valorString));
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
            setImagenAsset(asset); // Guardar el objeto completo para la subida
            setImagenUri(asset.uri); // Guardar la URI para mostrar en el componente
        }
    };

    const handleGuardar = async () => {
        const montoNum = parseFloat(monto);
        
        if (!nombre.trim() || isNaN(montoNum) || montoNum <= 0) {
            Alert.alert('Error', 'Nombre y precio válido son obligatorios.');
            return;
        }
        if (!tasa) {
             Alert.alert('Error', 'No se ha podido obtener la tasa de dólar. Vuelve a intentar o configúrala.');
             return;
        }

        // 1. Determinar el precio base en USD (único que guardaremos en la BD)
        const precioUsd = moneda === 'usd' 
            ? montoNum 
            : parseFloat((montoNum / tasa).toFixed(2));
        
        // 2. Subir imagen (si fue seleccionada)
        let imagenUrlGuardada = null;
        if (imagenAsset) {
            try {
                imagenUrlGuardada = await uploadAndGetUrl(
                    imagenAsset.uri, 
                    imagenAsset.fileName || 'imagen_platillo',
                    imagenAsset.type
                );
            } catch (e) {
                // Si la subida falla, abortamos
                Alert.alert('Error', 'No se pudo subir la imagen del platillo. Inténtalo de nuevo.');
                return;
            }
        }
        
        // 3. Preparar el objeto para la BD
        const nuevoPlatillo = {
            nombre,
            precio_usd: precioUsd, // Usamos el nombre de columna de la BD
            descripcion,
            imagen_url: imagenUrlGuardada // Guardamos la URL pública (o null)
        };

        // 4. Insertar el platillo en la base de datos
        try {
            // La función insertarPlatillo usa el servicio de Supabase
            await insertarPlatillo(nuevoPlatillo); 
            
            Alert.alert('✅', 'Platillo guardado en la nube exitosamente');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'No se pudo guardar el platillo en la base de datos.');
            console.error('Error al guardar platillo:', error);
        }
    };

    // La lógica de renderizado solo necesita el precio en USD para mostrar en la interfaz
    // y el precio en Bs calculado en tiempo real (si la tasa está disponible).
    const precioUsdCalculado = moneda === 'usd' ? monto : (monto / tasa)?.toFixed(2) || '...';
    const precioBsCalculado = moneda === 'bs' ? monto : (monto * tasa)?.toFixed(2) || '...';


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
                    >
                        <Text style={styles.textoBotonArribaDerecha}>✔ Guardar</Text>
                    </TouchableOpacity>

                    {/* Mostrar Precios Calculados */}
                    <View style={styles.resumenPrecios}>
                        <Text style={styles.resumenTexto}>USD (Guardado): ${precioUsdCalculado}</Text>
                        <Text style={styles.resumenTexto}>Bs (Estimado): Bs {precioBsCalculado}</Text>
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
                        onValueChange={(value) => setMoneda(value)}
                        style={styles.input}
                    >
                        <Picker.Item label="Dólares (USD)" value="usd" />
                        <Picker.Item label="Bolívares (Bs)" value="bs" />
                    </Picker>

                    <Text style={styles.label}>Monto en {moneda === 'usd' ? 'USD' : 'Bs'}</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={monto}
                        onChangeText={setMonto}
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
                            source={{ uri: imagenUri }} // Usamos imagenUri para la vista previa
                            style={{ width: '100%', height: '100%', borderRadius: 10 }}
                        />
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default CrearPlatillo;