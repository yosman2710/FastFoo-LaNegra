import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
// Eliminamos: import AsyncStorage from '@react-native-async-storage/async-storage';

// Importamos las nuevas funciones de Supabase
import { obtenerTasaDolar, actualizarTasaDolar } from '../services/configService.js'; 

// -----------------------------------------------------------------
// FUNCIÓN ELIMINADA: actualizarPreciosBolivares
// (Ya no es necesaria. La app calcula los Bs en tiempo real.)
// -----------------------------------------------------------------

const Configuracion = () => {
    const [tasa, setTasa] = useState('');
    
    // Función de carga (Reemplaza la lectura de AsyncStorage)
    useEffect(() => {
        const cargarTasa = async () => {
            try {
                // Leer la tasa desde la tabla 'configuracion' de Supabase
                const guardada = await obtenerTasaDolar();
                if (guardada) {
                    setTasa(guardada); // 'guardada' ya viene como string
                }
            } catch (error) {
                console.error('Error al cargar tasa:', error);
                Alert.alert('Error', 'No se pudo cargar la tasa de dólar desde la nube.');
            }
        };
        cargarTasa();
    }, []);

    // Función de guardado (Reemplaza la escritura en AsyncStorage)
    const guardarTasa = async () => {
        const valor = parseFloat(tasa);
        
        if (!isNaN(valor) && valor > 0) {
            try {
                // 1. Guardar la nueva tasa en la tabla 'configuracion' de Supabase
                await actualizarTasaDolar(valor.toFixed(2).toString()); // Guardamos con 2 decimales como string

                // 2. Notificación
                Alert.alert('✅ Tasa actualizada', `1 USD = ${valor.toFixed(2)} Bs\nLa tasa se ha guardado en la nube.`);
                
                // NOTA: Los demás dispositivos que usen obtenerTasaDolar
                // verán este cambio automáticamente.

            } catch (error) {
                console.error('Error al guardar la tasa en Supabase:', error);
                Alert.alert('Error', 'No se pudo guardar la tasa de dólar en la nube.');
            }

        } else {
            Alert.alert('⚠️ Valor inválido', 'Ingresa un número mayor a 0');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>Tasa actual del dólar (Bs):</Text>
            <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={tasa}
                onChangeText={setTasa}
                placeholder="Ej: 40.00"
            />
            <TouchableOpacity style={styles.boton} onPress={guardarTasa}>
                <Text style={styles.botonTexto}>Guardar</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 40, backgroundColor: '#ffe6ea', flex: 1 },
    titulo: {
        fontSize: 26,
        fontWeight: 'bold',
        marginTop: 30,
        marginBottom: 10,
        textAlign: 'center',
        color: '#333',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: 20
    },
    boton: {
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center'
    },
    botonTexto: { color: '#fff', fontWeight: 'bold' }
});

export default Configuracion;