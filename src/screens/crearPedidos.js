import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { obtenerPlatillos } from '../services/dishService.js';
import { guardarPedido } from '../services/orderServices.js';
import { styles } from '../styles/crearPedidos.style.js';

const CrearPedido = ({ navigation }) => {
  const [platillos, setPlatillos] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [cliente, setCliente] = useState('');
  const [direccion, setDireccion] = useState('');
  const [tasa, setTasa] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      const data = await obtenerPlatillos();
      setPlatillos(data);
      const inicial = {};
      data.forEach(p => { inicial[p.id] = 0; });
      setCantidades(inicial);

      const valorTasa = await AsyncStorage.getItem('tasa_dolar');
      if (valorTasa) setTasa(parseFloat(valorTasa));
    };
    cargarDatos();
  }, []);

  const incrementar = (id) => {
    setCantidades(prev => ({ ...prev, [id]: prev[id] + 1 }));
  };

  const decrementar = (id) => {
    setCantidades(prev => ({ ...prev, [id]: Math.max(prev[id] - 1, 0) }));
  };

  const calcularTotal = () => {
    let totalUsd = 0;
    let totalBs = 0;

    platillos.forEach(p => {
      const cantidad = cantidades[p.id] || 0;
      const usd = p.precioUsd ?? (p.precioBs && tasa ? p.precioBs / tasa : 0);
      const bs = p.precioBs ?? (p.precioUsd && tasa ? p.precioUsd * tasa : 0);
      totalUsd += cantidad * usd;
      totalBs += cantidad * bs;
    });

    return {
      usd: totalUsd.toFixed(2),
      bs: totalBs.toFixed(2)
    };
  };

  const confirmarPedido = async () => {
    const items = platillos
      .filter(p => cantidades[p.id] > 0)
      .map(p => ({
        id: p.id,
        nombre: p.nombre,
        precioUsd: p.precioUsd,
        precioBs: p.precioBs,
        cantidad: cantidades[p.id]
      }));

   if (!cliente.trim()) {
  Alert.alert('Error', 'Debes ingresar el nombre o referencia del cliente');
  return;
}


    if (items.length === 0) {
      Alert.alert('Error', 'Debes seleccionar al menos un platillo');
      return;
    }

    const total = calcularTotal();

    const nuevoPedido = {
      id: Date.now().toString(),
      clientName: cliente,
      clientAddress: direccion,
      items,
      totalUsd: parseFloat(total.usd),
      totalBs: parseFloat(total.bs),
      pagado: 0,
      status: 'pendiente',
      createdAt: new Date().toISOString()
    };

    await guardarPedido(nuevoPedido);
    Alert.alert('✅', 'Pedido creado exitosamente');
    navigation.goBack();
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.nombre}>{item.nombre}</Text>
      <Text style={styles.precio}>
        ${item.precioUsd?.toFixed(2)} / Bs {item.precioBs?.toFixed(2)}
      </Text>
      <View style={styles.controles}>
        <TouchableOpacity onPress={() => decrementar(item.id)} style={styles.botonControl}>
          <Text style={styles.controlTexto}>−</Text>
        </TouchableOpacity>
        <Text style={styles.cantidad}>{cantidades[item.id]}</Text>
        <TouchableOpacity onPress={() => incrementar(item.id)} style={styles.botonControl}>
          <Text style={styles.controlTexto}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const total = calcularTotal();

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Crear Pedido</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre o referencia del cliente"
        value={cliente}
        onChangeText={setCliente}
      />

      <TextInput
        style={styles.input}
        placeholder="Dirección del cliente"
        value={direccion}
        onChangeText={setDireccion}
      />

      <FlatList
        style={styles.listaPlatillos}
        data={platillos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />

      <View style={styles.resumen}>
        <Text style={styles.resumenTitulo}>Resumen del Pedido</Text>
        <Text style={styles.total}>Total: ${total.usd} / Bs {total.bs}</Text>
      </View>

      <TouchableOpacity style={styles.botonConfirmar} onPress={confirmarPedido}>
        <Text style={styles.textoBoton}>Confirmar Pedido</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CrearPedido;