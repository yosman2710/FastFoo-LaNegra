import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { insertarPlatillo } from '../services/dishService.js';
import { styles } from '../styles/crearPlatillos.styles.js';

const DEFAULT_IMAGE = Image.resolveAssetSource(require('../../assets/default-dish.png')).uri;

const CrearPlatillo = ({ navigation }) => {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagen, setImagen] = useState('');

  const seleccionarImagen = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.6 });
    if (result.assets && result.assets.length > 0) {
      setImagen(result.assets[0].uri);
    }
  };

  const handleGuardar = async () => {
    if (!nombre.trim() || isNaN(precio) || parseFloat(precio) <= 0) {
      Alert.alert('Error', 'Nombre y precio válidos son obligatorios');
      return;
    }

    const nuevoPlatillo = {
      nombre,
      precio: parseFloat(precio),
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Crear Nuevo Platillo</Text>

      <Text style={styles.label}>Nombre del Platillo</Text>
      <TextInput
        style={styles.input}
        value={nombre}
        onChangeText={setNombre}
      />

      <Text style={styles.label}>Precio</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={precio}
        onChangeText={setPrecio}
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
  );
};

export default CrearPlatillo;
