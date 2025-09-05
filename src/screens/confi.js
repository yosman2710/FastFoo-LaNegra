import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { obtenerPlatillos, actualizarPlatillo } from '../services/dishService';

const actualizarPreciosBolivares = async (nuevaTasa) => {
  try {
    const platillos = await obtenerPlatillos();

    for (const p of platillos) {
      if (p.precioUsd != null) {
        const nuevoBs = parseFloat((p.precioUsd * nuevaTasa).toFixed(2));
        const actualizado = { ...p, precioBs: nuevoBs };
        await actualizarPlatillo(p.id, actualizado);
      }
    }

    console.log('✅ Precios Bs actualizados');
  } catch (error) {
    console.error('❌ Error al actualizar precios Bs:', error);
  }
};


const Configuracion = () => {
  const [tasa, setTasa] = useState('');

  useEffect(() => {
    const cargarTasa = async () => {
      const guardada = await AsyncStorage.getItem('tasa_dolar');
      if (guardada) setTasa(guardada);
    };
    cargarTasa();
  }, []);

  const guardarTasa = async () => {
    const valor = parseFloat(tasa);
    if (!isNaN(valor) && valor > 0) {
      await AsyncStorage.setItem('tasa_dolar', valor.toString());
       await actualizarPreciosBolivares(valor); 
     Alert.alert('✅ Tasa actualizada', `1 USD = ${valor} Bs\nLos precios en Bs fueron recalculados`);

    } else {
      Alert.alert('⚠️ Valor inválido', 'Ingresa un número mayor a 0');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tasa actual del dólar (Bs):</Text>
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
  label: { fontSize: 16, marginBottom: 20 },
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