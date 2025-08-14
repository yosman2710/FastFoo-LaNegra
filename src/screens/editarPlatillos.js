import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { obtenerPlatilloPorId, actualizarPlatillo } from '../services/dishService.js';
import { styles } from '../styles/crearPlatillos.styles.js';

const EditarPlatillos = ({ route, navigation }) => {
  const { id } = route.params;

  const [platillo, setPlatillo] = useState(null);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagen, setImagen] = useState('');

  useEffect(() => {
    const cargarDatos = async () => {
      const datos = await obtenerPlatilloPorId(id);
      if (!datos) {
        Alert.alert('Error', 'Platillo no encontrado');
        navigation.goBack();
        return;
      }

      setPlatillo(datos);
      setNombre(datos.nombre);
      setPrecio(datos.precio.toString());
      setDescripcion(datos.descripcion || '');
      setImagen(datos.imagen);
    };

    cargarDatos();
  }, [id]);

  const handleGuardar = async () => {
    if (!nombre.trim() || isNaN(precio) || parseFloat(precio) <= 0) {
      Alert.alert('Error', 'Nombre y precio válidos son obligatorios');
      return;
    }

    const platilloActualizado = {
      ...platillo,
      nombre,
      precio: parseFloat(precio),
      imagen,
      descripcion
    };

    try {
      await actualizarPlatillo(id, platilloActualizado);
      Alert.alert('✅', 'Platillo actualizado');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el platillo');
      console.error(error);
    }
  };

  const seleccionarImagen = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.6 });
    if (result.assets && result.assets.length > 0) {
      setImagen(result.assets[0].uri);
    }
  };

  if (!platillo) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={{ marginTop: 10 }}>Cargando platillo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Editar Platillo</Text>

      <Text style={styles.seccionTitulo}>Información del Platillo</Text>

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
        {imagen ? (
          <Image source={{ uri: imagen }} style={{ width: '100%', height: '100%', borderRadius: 10 }} />
        ) : (
          <>
            <Image
              source={require('../../assets/camera-icon.png')}
              style={styles.cameraIcon}
            />
            <Text style={styles.imageText}>Imagen importada del sistema</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.botonGuardar} onPress={handleGuardar}>
        <Text style={styles.textoBoton}>Guardar Cambios</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EditarPlatillos;
