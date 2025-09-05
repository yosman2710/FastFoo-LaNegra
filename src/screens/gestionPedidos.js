import React, { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { obtenerPedidos } from '../services/orderServices';
import { styles } from '../styles/gestionPedidos.style.js';

const GestionPedidos = ({ navigation }) => {
  const [pedidos, setPedidos] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  useFocusEffect(
    useCallback(() => {
      cargarPedidos();
    }, [])
  );

  const actualizarEstado = (pedido) => {
    const pagado = pedido.pagadoUsd ?? 0;
    const total = pedido.totalUsd ?? 0;

    if (pagado === 0) return 'pendiente';
    if (pagado < total) return 'abonado';
    return 'completado';
  };

  const cargarPedidos = async () => {
    const data = await obtenerPedidos();
    const actualizados = data.map(p => ({
      ...p,
      estado: actualizarEstado(p)
    }));
    setPedidos(actualizados.reverse());
  };

  const filtrarPedidos = () => {
    return pedidos.filter(p =>
      p.clientName.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.id.includes(busqueda)
    );
  };

  const eliminarPedido = async (id) => {
    Alert.alert('¿Eliminar?', '¿Deseas eliminar este pedido?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const actualizados = pedidos.filter(p => p.id !== id);
          await AsyncStorage.setItem('pedidos_app', JSON.stringify(actualizados));
          setPedidos(actualizados);
        }
      }
    ]);
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente':
        return '#e53935';
      case 'abonado':
        return '#fb8c00';
      case 'completado':
        return '#43a047';
      default:
        return '#000';
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.id}>Pedido #{item.id}</Text>
      <Text style={styles.nombre}>Nombre: {item.clientName}</Text>
      <Text style={styles.total}>Total: ${item.totalUsd?.toFixed(2)}</Text>
      <Text style={styles.pagado}>Pagado: ${item.pagadoUsd?.toFixed(2) ?? 0}</Text>
      <Text style={styles.fecha}>Fecha: {new Date(item.createdAt).toLocaleDateString()}</Text>
      <Text style={[styles.estado, { color: getEstadoColor(item.estado) }]}>
        Estado: {item.estado}
      </Text>

      <View style={styles.acciones}>
        <TouchableOpacity
          style={styles.botonVer}
          onPress={() => navigation.navigate('DetallePedido', { pedido: item })}
        >
          <Text style={styles.textoBoton}>Ver</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonEliminar}
          onPress={() => eliminarPedido(item.id)}
        >
          <Text style={styles.textoBoton}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Mis Pedidos</Text>

      <TextInput
        style={styles.input}
        placeholder="Buscar pedidos..."
        value={busqueda}
        onChangeText={setBusqueda}
      />

      <FlatList
        data={filtrarPedidos()}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />

      
      <TouchableOpacity
        style={styles.botonFlotante}
        onPress={() => navigation.navigate('CrearPedido')}
      >
        <Text style={styles.iconoFlotante}>＋</Text>
      </TouchableOpacity>
    </View>
  );
};

export default GestionPedidos;

