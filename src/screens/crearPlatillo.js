import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { insertarPlatillo } from '../services/dishService.js';
import { styles } from '../styles/crearPlatillos.styles.js';

const DEFAULT_IMAGE = Image.resolveAssetSource(require('../../assets/default-dish.png')).uri;

const CrearPlatillo = ({ navigation }) => {
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState('usd'); // 'usd' o 'bs'
  const [descripcion, setDescripcion] = useState('');
  const [imagen, setImagen] = useState('');
  const [tasa, setTasa] = useState(null);

  useEffect(() => {
    const cargarTasa = async () => {
      const valor = await AsyncStorage.getItem('tasa_dolar');
      if (valor) setTasa(parseFloat(valor));
    };
    cargarTasa();
  }, []);

  const seleccionarImagen = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.6 });
    if (result.assets && result.assets.length > 0) {
      setImagen(result.assets[0].uri);
    }
  };

  const handleGuardar = async () => {
    const montoNum = parseFloat(monto);
    if (!nombre.trim() || isNaN(montoNum) || montoNum <= 0 || !tasa) {
      Alert.alert('Error', 'Nombre, precio válido y tasa de cambio son obligatorios');
      return;
    }

    const precioUsd = moneda === 'usd' ? montoNum : parseFloat((montoNum / tasa).toFixed(2));
    const precioBs = moneda === 'bs' ? montoNum : parseFloat((montoNum * tasa).toFixed(2));

    const nuevoPlatillo = {
      nombre,
      precioUsd,
      precioBs,
      descripcion,
      imagen: imagen || DEFAULT_IMAGE
    };

    try {
      await insertarPlatillo(nuevoPlatillo);
      Alert.alert('✅', 'Platillo guardado exitosamente');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el platillo');
      console.error(error);
    }
  };

  return (
    <SafeAreaView>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>Crear Nuevo Platillo</Text>

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
          source={{ uri: imagen || DEFAULT_IMAGE }}
          style={{ width: '100%', height: '100%', borderRadius: 10 }}
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.botonGuardar} onPress={handleGuardar}>
        <Text style={styles.textoBoton}>Guardar Platillo</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
};

export default CrearPlatillo;