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
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { Picker } from '@react-native-picker/picker';

// Importamos servicios de Supabase
import { obtenerPlatilloPorId, actualizarPlatillo } from '../services/dishService.js';
import { obtenerTasaDolar } from '../services/configService.js';
import { supabase } from '../utils/supabase.js';

import { styles } from '../styles/crearPlatillos.styles.js';

const BUCKET_NAME = 'imagenes-platillos';
const DEFAULT_IMAGE_LOCAL = require('../../assets/default-dish.png');

// ----------------------------------------------------------------
// FUNCIÓN AUXILIAR: SUBIR IMAGEN A SUPABASE STORAGE
// -----------------------------------------------------------------
const uploadAndGetUrl = async (uri, fileName, contentType) => {
    try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const filePath = `${Date.now()}_${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, blob, { contentType: contentType, upsert: false });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    } catch (e) {
        console.error('Error en uploadAndGetUrl:', e);
        throw new Error('Falló al subir la imagen al Storage.');
    }
};

const EditarPlatillos = ({ route, navigation }) => {
    const { id } = route.params;

    const [platillo, setPlatillo] = useState(null);
    const [nombre, setNombre] = useState('');
    // Usar '' para TextInput
    const [monto, setMonto] = useState('');
    const [moneda, setMoneda] = useState('usd');
    const [descripcion, setDescripcion] = useState('');
    const [imagenUri, setImagenUri] = useState('');
    const [imagenAsset, setImagenAsset] = useState(null);
    // Usar 0 para la tasa si falla la carga
    const [tasa, setTasa] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false); // Para el botón Guardar

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // 1. Cargar Platillo
                const datos = await obtenerPlatilloPorId(id);
                if (!datos) throw new Error('Platillo no encontrado.');

                // 2. Cargar Tasa (Asegurar que sea un número, si falla, null)
                const tasaGuardadaString = await obtenerTasaDolar();
                const tasaValor = Number(tasaGuardadaString) || null; // Null si no es un número válido

                if (!tasaValor) {
                    Alert.alert('Advertencia', 'No se pudo obtener la tasa de cambio. No se podrá guardar en Bs.');
                }

                setPlatillo(datos);
                setNombre(datos.nombre);
                setDescripcion(datos.descripcion || '');
                setTasa(tasaValor);

                // 3. Inicializar campos
                if (datos.precio_usd !== undefined && datos.precio_usd !== null) {
                    setMoneda('usd');
                    // Conversión segura a String
                    setMonto(Number(datos.precio_usd).toFixed(2));
                }

                setImagenUri(datos.imagen_url || '');

            } catch (error) {
                console.error('Error al cargar datos:', error);
                Alert.alert('Error Fatal', 'No se pudo cargar el platillo. Verifique la conexión: ' + error.message);
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
            setImagenAsset(asset);
            setImagenUri(asset.uri);
        }
    };

    const handleGuardar = async () => {
        setIsSaving(true);
        const montoNum = Number(monto); // Usar Number() para conversión segura

        // --- VALIDACIONES ESTRICTAS ---
        if (!nombre.trim()) {
            Alert.alert('Error', 'El nombre del platillo es obligatorio.');
            setIsSaving(false);
            return;
        }
        if (isNaN(montoNum) || montoNum <= 0) {
            Alert.alert('Error', 'Debe ingresar un precio válido y positivo.');
            setIsSaving(false);
            return;
        }
        if (moneda === 'bs' && !tasa) {
            Alert.alert('Error', 'No se pudo cargar la tasa de cambio. Guarde el precio en USD.');
            setIsSaving(false);
            return;
        }

        // 1. Determinar el precio base en USD (único que guardaremos)
        let precioUsd;
        if (moneda === 'usd') {
            precioUsd = montoNum;
        } else { // moneda === 'bs'
            // Usamos || 1 para evitar división por cero, aunque ya validamos que 'tasa' exista.
            precioUsd = parseFloat((montoNum / (tasa || 1)).toFixed(2));
        }

        // 2. Subir nueva imagen si se seleccionó una
        let imagenUrlGuardada = platillo.imagen_url;
        if (imagenAsset) {
            try {
                imagenUrlGuardada = await uploadAndGetUrl(
                    imagenAsset.uri,
                    imagenAsset.fileName || `imagen_${id}`,
                    imagenAsset.type
                );
            } catch (e) {
                // Si falla la subida, avisamos pero permitimos guardar el resto de los datos
                Alert.alert('Error', 'No se pudo subir la nueva imagen. Se guardarán los datos de texto.');
                imagenUrlGuardada = platillo.imagen_url;
            }
        }

        // 3. Preparar el objeto para la ACTUALIZACIÓN
        const platilloActualizado = {
            nombre: nombre.trim(),
            precio_usd: precioUsd,
            descripcion: descripcion.trim(),
            imagen_url: imagenUrlGuardada,
            // Podrías añadir aquí 'activo' si lo usas en el formulario
        };

        try {
            // 4. Actualizar el registro en la base de datos
            await actualizarPlatillo(id, platilloActualizado);

            Alert.alert('✅ Éxito', 'Platillo actualizado exitosamente.');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Fallo en la conexión al actualizar el platillo.');
            console.error('Error al actualizar platillo:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !platillo) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{ marginTop: 10 }}>Cargando platillo...</Text>
            </View>
        );
    }

    // Cálculos de precios seguros (usando Number() y || 0 para evitar fallos de NaN)
    const montoBase = Number(monto) || 0;
    const tasaActual = Number(tasa) || 0;

    const precioUsdCalculado = moneda === 'usd' ? montoBase.toFixed(2) : (montoBase / (tasaActual || 1))?.toFixed(2) || '...';
    const precioBsCalculado = moneda === 'bs' ? montoBase.toFixed(2) : (montoBase * tasaActual)?.toFixed(2) || '...';


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
                        disabled={isSaving}
                    >
                        <Text style={styles.textoBotonArribaDerecha}>
                            {isSaving ? 'Guardando...' : '✔ Guardar'}
                        </Text>
                    </TouchableOpacity>

                    {/* Mostrar Precios Calculados */}
                    <View style={styles.resumenPrecios}>
                        <Text style={styles.resumenTexto}>USD (Guardado): ${precioUsdCalculado}</Text>
                        <Text style={styles.resumenTexto}>Bs (Estimado): Bs {precioBsCalculado}</Text>
                        {tasaActual === 0 && <Text style={{ color: 'red', marginTop: 5 }}>Tasa de cambio no disponible.</Text>}
                    </View>

                    <Text style={styles.seccionTitulo}>Información del Platillo</Text>

                    {/* ... (Resto de los inputs y picker) ... */}

                    {/* Campo Nombre */}
                    <Text style={styles.label}>Nombre del Platillo</Text>
                    <TextInput
                        style={styles.input}
                        value={nombre}
                        onChangeText={setNombre}
                    />

                    {/* Picker Moneda */}
                    <Text style={styles.label}>Moneda del Precio</Text>
                    <Picker
                        selectedValue={moneda}
                        onValueChange={setMoneda}
                        style={styles.input}
                        enabled={tasaActual !== 0} // Desactivar si no hay tasa para evitar errores
                    >
                        <Picker.Item label="Dólares (USD)" value="usd" />
                        <Picker.Item label="Bolívares (Bs)" value="bs" />
                    </Picker>

                    {/* Campo Monto */}
                    <Text style={styles.label}>Monto en {moneda === 'usd' ? 'USD' : 'Bs'}</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={monto}
                        onChangeText={(text) => setMonto(text.replace(/[^0-9.]/g, ''))} // Limpieza de input
                        placeholder={`Ej: ${moneda === 'usd' ? '4.50' : '180.00'}`}
                    />

                    {/* Campo Descripción */}
                    <Text style={styles.label}>Descripción</Text>
                    <TextInput
                        style={[styles.input, { height: 80 }]}
                        multiline
                        value={descripcion}
                        onChangeText={setDescripcion}
                    />

                    {/* Sección Imagen */}
                    <Text style={styles.label}>Imagen del Platillo</Text>
                    <TouchableOpacity style={styles.imageContainer} onPress={seleccionarImagen}>
                        {imagenUri ? (
                            <Image
                                source={{ uri: imagenUri }}
                                style={{ width: '100%', height: '100%', borderRadius: 10 }}
                            />
                        ) : (
                            <Image
                                source={DEFAULT_IMAGE_LOCAL}
                                style={{ width: '100%', height: '100%', borderRadius: 10 }}
                                resizeMode="cover"
                            />
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default EditarPlatillos;