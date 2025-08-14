import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  Button,
  TextInput,
  Alert,
  Image,
  TouchableOpacity
} from 'react-native';
import {
  obtenerPlatillos,
  buscarPlatilloPorNombre,
  eliminarPlatillo
} from '../services/dishService.js';
import { styles } from '../styles/gestionPlatillos.styles.js';

const DEFAULT_IMAGE = 'https://via.placeholder.com/100'; // Imagen por defecto

const GestionPlatillos = ({ navigation }) => {
  const [platillos, setPlatillos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    cargarPlatillos();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleBuscar();
    }, 300); // Espera 300ms después de escribir

    return () => clearTimeout(delayDebounce);
  }, [busqueda]);

  const cargarPlatillos = async () => {
    try {
      const data = await obtenerPlatillos();
      setPlatillos(data);
      setError('');
    } catch (err) {
      setError('❌ Error al cargar los platillos');
    }
  };

  const handleBuscar = async () => {
    try {
      if (busqueda.trim() === '') {
        cargarPlatillos();
      } else {
        const resultados = await buscarPlatilloPorNombre(busqueda);
        setPlatillos(resultados);
        setError('');
      }
    } catch (err) {
      setError('❌ Error al buscar platillos');
    }
  };

  const handleEliminar = async (id) => {
    try {
      await eliminarPlatillo(id);
      handleBuscar(); // actualiza según el filtro activo
    } catch (err) {
      Alert.alert('Error', 'No se pudo eliminar el platillo');
    }
  };

  const renderPlatillo = ({ item }) => (
  <View style={styles.card}>
    <View style={styles.filaPlatillo}>
      <Image
        source={{ uri: item.imagen || DEFAULT_IMAGE }}
        style={styles.imagenPlatillo}
      />
      <View style={styles.infoPlatillo}>
        <Text style={styles.nombrePlatillo}>{item.nombre}</Text>
        <Text style={styles.precioPlatillo}>Precio: ${item.precio}</Text>
        <Text style={styles.descripcionPlatillo}>{item.descripcion}</Text>
      </View>
    </View>

    <View style={styles.botonesFila}>
  <TouchableOpacity
    style={[styles.botonAccion, styles.botonEditar]}
    onPress={() => navigation.navigate('EditarPlatillo', { id: item.id })}
  >
    <Text style={styles.textoBoton}>Editar</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.botonAccion, styles.botonEliminar]}
    onPress={() => handleEliminar(item.id)}
  >
    <Text style={styles.textoBoton}>Eliminar</Text>
  </TouchableOpacity>
</View>
  </View>
);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.inputBuscar}
        placeholder="Buscar platillo por nombre..."
        value={busqueda}
        onChangeText={setBusqueda}
      />

      {error !== '' && <Text style={styles.error}>{error}</Text>}

      {platillos.length === 0 ? (
        <Text style={styles.mensajeVacio}>No se encontraron platillos</Text>
      ) : (
        <FlatList
          data={platillos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPlatillo}
        />
      )}

      <TouchableOpacity
        style={styles.botonNuevo}
        onPress={() => navigation.navigate('CrearPlatillo')}
      >
        <Text style={styles.textoBoton}>➕ Agregar platillo</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botonNuevo}
        onPress={cargarPlatillos}
      >
        <Text style={styles.textoBoton}>🔄 Recargar</Text>
      </TouchableOpacity>
    </View>
  );
};

export default GestionPlatillos;
