import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { actualizarPedido } from '../services/orderServices.js';
import { obtenerPlatillos } from '../services/dishService.js';
import { styles } from '../styles/verDetallesPedidos.style.js';


const PedidoDetalle = ({ route, navigation }) => {
  const { pedido } = route.params;

 const [menuDisponible, setMenuDisponible] = useState([]);


  const [pedidoActual, setPedidoActual] = useState({
    ...pedido,
    pagado: pedido.pagado ?? 0,
    estado: pedido.estado ?? 'pendiente',
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [montoAbonar, setMontoAbonar] = useState('');
  const [platilloSeleccionado, setPlatilloSeleccionado] = useState(menuDisponible[0]?.id);

  useEffect(() => {
  const cargarMenu = async () => {
    try {
      const platillos = await obtenerPlatillos();
      setMenuDisponible(platillos);
      if (platillos.length > 0) {
        setPlatilloSeleccionado(platillos[0].id);
      }
    } catch (error) {
      console.error('Error al cargar platillos:', error);
    }
  };

  cargarMenu();
}, []);

  const actualizarEstado = (pedido) => {
    if (pedido.pagado === 0) return 'pendiente';
    if (pedido.pagado < pedido.total) return 'abonado';
    return 'completado';
  };

  const abonar = () => {
    const monto = parseFloat(montoAbonar);
    if (!isNaN(monto) && monto > 0) {
      const nuevoPagado = pedidoActual.pagado + monto;
      const actualizado = {
        ...pedidoActual,
        pagado: nuevoPagado,
        estado: actualizarEstado({ ...pedidoActual, pagado: nuevoPagado }),
      };
      setPedidoActual(actualizado);
      setMontoAbonar('');
      setModalVisible(false);
    }
  };

  const modificarCantidad = (id, delta) => {
    const itemsActualizados = pedidoActual.items.map(item =>
      item.id === id
        ? { ...item, cantidad: Math.max(1, item.cantidad + delta) }
        : item
    );
    const nuevoTotal = itemsActualizados.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    const actualizado = {
      ...pedidoActual,
      items: itemsActualizados,
      total: nuevoTotal,
      estado: actualizarEstado({ ...pedidoActual, total: nuevoTotal }),
    };
    setPedidoActual(actualizado);
  };

  const eliminarPlatillo = (id) => {
    const itemsFiltrados = pedidoActual.items.filter(item => item.id !== id);
    const nuevoTotal = itemsFiltrados.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    const actualizado = {
      ...pedidoActual,
      items: itemsFiltrados,
      total: nuevoTotal,
      estado: actualizarEstado({ ...pedidoActual, total: nuevoTotal }),
    };
    setPedidoActual(actualizado);
  };

  const agregarPlatillo = () => {
    const platillo = menuDisponible.find(p => p.id === platilloSeleccionado);
    if (!platillo) return;

    const yaExiste = pedidoActual.items.find(item => item.id === platillo.id);
    const itemsActualizados = yaExiste
      ? pedidoActual.items.map(item =>
          item.id === platillo.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      : [...pedidoActual.items, { ...platillo, cantidad: 1 }];

    const nuevoTotal = itemsActualizados.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    const actualizado = {
      ...pedidoActual,
      items: itemsActualizados,
      total: nuevoTotal,
      estado: actualizarEstado({ ...pedidoActual, total: nuevoTotal }),
    };

    setPedidoActual(actualizado);
    setSelectorVisible(false);
  };

  const guardarCambios = async () => {
    await actualizarPedido(pedidoActual);
    Alert.alert('Pedido actualizado', 'Los cambios han sido guardados.');
    navigation.goBack();
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemNombre}>{item.nombre}</Text>
      <Text>Cantidad: {item.cantidad}</Text>
      <Text>Precio: ${item.precio.toFixed(2)}</Text>
      {pedidoActual.estado !== 'completado' && (
        <View style={styles.itemControles}>
          <TouchableOpacity onPress={() => modificarCantidad(item.id, 1)}>
            <Text style={styles.control}>➕</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => modificarCantidad(item.id, -1)}>
            <Text style={styles.control}>➖</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => eliminarPlatillo(item.id)}>
            <Text style={styles.control}>🗑️</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const pendiente = pedidoActual.total - pedidoActual.pagado;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pedido de {pedidoActual.clientName}</Text>
      <Text style={styles.direccion}>{pedidoActual.clientAddress}</Text>
      <Text style={styles.estado}>Estado: <Text style={styles.estadoValor}>{pedidoActual.estado}</Text></Text>

      <FlatList
        data={pedidoActual.items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.lista}
      />

      <View style={styles.resumen}>
        <Text style={styles.total}>Total: ${pedidoActual.total.toFixed(2)}</Text>
        <Text style={styles.pagado}>Pagado: ${pedidoActual.pagado.toFixed(2)}</Text>
        <Text style={styles.pendiente}>Pendiente: ${pendiente.toFixed(2)}</Text>
      </View>

      {pedidoActual.estado !== 'completado' && (
        <>
          <TouchableOpacity style={styles.botonAbonar} onPress={() => setModalVisible(true)}>
            <Text style={styles.botonTexto}>Abonar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botonAgregar} onPress={() => setSelectorVisible(true)}>
            <Text style={styles.botonTexto}>Agregar Platillo</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.botonGuardar} onPress={guardarCambios}>
        <Text style={styles.botonTexto}>Guardar Cambios</Text>
      </TouchableOpacity>

      {/* Modal Abonar */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalFondo}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Monto a Abonar</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 50"
              keyboardType="numeric"
              value={montoAbonar}
              onChangeText={setMontoAbonar}
            />
            <View style={styles.modalBotones}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={abonar}>
                <Text style={styles.aceptar}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Selector de Platillo */}
      <Modal visible={selectorVisible} transparent animationType="fade">
        <View style={styles.modalFondo}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Selecciona un platillo</Text>
            <View style={styles.pickerContainer}>
             <Picker
  selectedValue={platilloSeleccionado}
  onValueChange={(itemValue) => setPlatilloSeleccionado(itemValue)}
>
  {menuDisponible.map(p => (
    <Picker.Item key={p.id} label={`${p.nombre} - $${p.precio}`} value={p.id} />
  ))}
</Picker>

            </View>
            <View style={styles.modalBotones}>
              <TouchableOpacity onPress={() => setSelectorVisible(false)}>
                <Text style={styles.cancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={agregarPlatillo}>
                <Text style={styles.aceptar}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};



export default PedidoDetalle;


