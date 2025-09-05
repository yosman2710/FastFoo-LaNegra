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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { obtenerPlatilloPorId, actualizarPlatillo } from '../services/dishService.js';
import { styles } from '../styles/crearPlatillos.styles.js';

const EditarPlatillos = ({ route, navigation }) => {
  const { id } = route.params;

  const [platillo, setPlatillo] = useState(null);
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState('usd');
  const [descripcion, setDescripcion] = useState('');
  const [imagen, setImagen] = useState('');
  const [tasa, setTasa] = useState(null);

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
      setDescripcion(datos.descripcion || '');
      setImagen(datos.imagen);

      const tasaGuardada = await AsyncStorage.getItem('tasa_dolar');
      if (tasaGuardada) setTasa(parseFloat(tasaGuardada));

      // Detectar moneda original
      if (datos.precioUsd) {
        setMoneda('usd');
        setMonto(datos.precioUsd.toString());
      } else if (datos.precioBs) {
        setMoneda('bs');
        setMonto(datos.precioBs.toString());
      }
    };

    cargarDatos();
  }, [id]);

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

    const platilloActualizado = {
      ...platillo,
      nombre,
      precioUsd,
      precioBs,
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
