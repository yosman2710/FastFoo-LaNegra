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
    SafeAreaView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
// ELIMINAMOS: import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { Picker } from '@react-native-picker/picker';

// Importamos servicios de Supabase
import { obtenerPlatilloPorId, actualizarPlatillo } from '../services/dishService.js'; 
import { obtenerTasaDolar } from '../services/configService.js';
import { supabase } from '../utils/supabase.js'; // Necesario para el Storage

import { styles } from '../styles/crearPlatillos.styles.js';

const BUCKET_NAME = 'imagenes-platillos'; // ¡Asegúrate de que este sea el nombre de tu Bucket!
// Necesitarás definir tu DEFAULT_IMAGE o usar una que no requiera el resolveAssetSource aquí.
// const DEFAULT_IMAGE = 'URL_DEFAULT_SI_NO_HAY_IMAGEN'; 

// -----------------------------------------------------------------
// FUNCIÓN AUXILIAR: SUBIR IMAGEN A SUPABASE STORAGE
// (Copiada de CrearPlatillo.js, idealmente debería estar en un util)
// -----------------------------------------------------------------
const uploadAndGetUrl = async (uri, fileName, contentType) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filePath = `${Date.now()}_${fileName}`;
    
    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME) 
        .upload(filePath, blob, { contentType: contentType, upsert: false });

    if (uploadError) throw new Error('Falló al subir la imagen al Storage.');
    
    const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
};

const EditarPlatillos = ({ route, navigation }) => {
    const { id } = route.params;

    const [platillo, setPlatillo] = useState(null);
    const [nombre, setNombre] = useState('');
    const [monto, setMonto] = useState('');
    const [moneda, setMoneda] = useState('usd');
    const [descripcion, setDescripcion] = useState('');
    const [imagenUri, setImagenUri] = useState(''); // URI para mostrar
    const [imagenAsset, setImagenAsset] = useState(null); // Asset para subir si es nueva
    const [tasa, setTasa] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // 1. Cargar Platillo desde Supabase
                const datos = await obtenerPlatilloPorId(id);
                if (!datos) throw new Error('Platillo no encontrado');
                
                // 2. Cargar Tasa desde Supabase
                const tasaGuardadaString = await obtenerTasaDolar();
                const tasaValor = parseFloat(tasaGuardadaString);

                setPlatillo(datos);
                setNombre(datos.nombre);
                setDescripcion(datos.descripcion || '');
                setTasa(tasaValor);

                // 3. Inicializar campos de precio y moneda (usando siempre precio_usd)
                if (datos.precio_usd) {
                    setMoneda('usd');
                    setMonto(datos.precio_usd.toString());
                }
                
                // 4. Inicializar imagen
                setImagenUri(datos.imagen_url || ''); // Usamos imagen_url de la DB
                
            } catch (error) {
                console.error('Error al cargar datos:', error);
                Alert.alert('Error', 'No se pudo cargar el platillo: ' + error.message);
                navigation.goBack();
            } finally {
                setIsLoading(false);
            }
        };

        cargarDatos();
    }, [id]);

    const seleccionarImagen = async () => {
        const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.6 });
        if (result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            setImagenAsset(asset); // Marcar que hay un nuevo asset para subir
            setImagenUri(asset.uri); // Mostrar la nueva imagen
        }
    };

    const handleGuardar = async () => {
        const montoNum = parseFloat(monto);
        
        if (!nombre.trim() || isNaN(montoNum) || montoNum <= 0 || !tasa) {
            Alert.alert('Error', 'Nombre, precio válido y tasa de cambio son obligatorios');
            return;
        }

        // 1. Determinar el precio base en USD (único que guardaremos)
        const precioUsd = moneda === 'usd' ? montoNum : parseFloat((montoNum / tasa).toFixed(2));
        
        // 2. Subir nueva imagen si se seleccionó una
        let imagenUrlGuardada = platillo.imagen_url; // Empezamos con la URL actual
        if (imagenAsset) {
            try {
                // Sube la nueva imagen y obtiene la URL
                imagenUrlGuardada = await uploadAndGetUrl(
                    imagenAsset.uri, 
                    imagenAsset.fileName || 'imagen_platillo',
                    imagenAsset.type
                );
                // NOTA: No eliminamos la imagen antigua por simplicidad.
            } catch (e) {
                Alert.alert('Error', 'No se pudo subir la nueva imagen.');
                return;
            }
        }
        
        // 3. Preparar el objeto para la ACTUALIZACIÓN
        const platilloActualizado = {
            nombre,
            precio_usd: precioUsd, // Guardamos el precio en USD
            descripcion,
            imagen_url: imagenUrlGuardada, // Nueva o antigua URL
            // No necesitamos 'precioBs' en la actualización
        };

        try {
            // 4. Actualizar el registro en la base de datos
            // La función usa el ID (UUID de Supabase) para el 'eq'
            await actualizarPlatillo(id, platilloActualizado); 
            
            Alert.alert('✅', 'Platillo actualizado exitosamente en la nube');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el platillo');
            console.error('Error al actualizar platillo:', error);
        }
    };

    if (isLoading || !platillo) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={{ marginTop: 10 }}>Cargando platillo...</Text>
            </View>
        );
    }
    
    // Cálculo de precios en tiempo real para la UI
    const precioUsdCalculado = moneda === 'usd' ? monto : (monto / tasa)?.toFixed(2) || '...';
    const precioBsCalculado = moneda === 'bs' ? monto : (monto * tasa)?.toFixed(2) || '...';


    return (
        <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={[styles.container, { paddingBottom: 100 }]}
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
                    
                    <Text style={styles.seccionTitulo}>Información del Platillo</Text>

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
                        {imagenUri ? (
                            <Image source={{ uri: imagenUri }} style={{ width: '100%', height: '100%', borderRadius: 10 }} />
                        ) : (
                            // Muestra un ícono si no hay imagen
                            <Text style={styles.imageText}>Toca para seleccionar imagen</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default EditarPlatillos;