import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { actualizarPedido } from '../services/orderServices.js';
import { obtenerPlatillos } from '../services/dishService.js';
import { styles } from '../styles/verDetallesPedidos.style.js';

const PedidoDetalle = ({ route, navigation }) => {
  const { pedido } = route.params;

  const [menuDisponible, setMenuDisponible] = useState([]);
  const [tasa, setTasa] = useState(null);
  const [pedidoActual, setPedidoActual] = useState({
    ...pedido,
    pagadoUsd: pedido.pagadoUsd ?? 0,
    pagadoBs: pedido.pagadoBs ?? 0,
    estado: pedido.estado ?? 'pendiente'
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [montoAbonar, setMontoAbonar] = useState('');
  const [monedaAbono, setMonedaAbono] = useState('usd');
  const [platilloSeleccionado, setPlatilloSeleccionado] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      const platillos = await obtenerPlatillos();
      setMenuDisponible(platillos);
      if (platillos.length > 0) setPlatilloSeleccionado(platillos[0].id);

      const valorTasa = await AsyncStorage.getItem('tasa_dolar');
      if (valorTasa) setTasa(parseFloat(valorTasa));
    };
    cargarDatos();
  }, []);

  const abonar = () => {
    const monto = parseFloat(montoAbonar);
    if (!isNaN(monto) && monto > 0 && tasa) {
      let nuevoPagadoUsd = pedidoActual.pagadoUsd || 0;
      let nuevoPagadoBs = pedidoActual.pagadoBs || 0;

      if (monedaAbono === 'usd') {
        nuevoPagadoUsd = parseFloat((nuevoPagadoUsd + monto).toFixed(2));
        nuevoPagadoBs = parseFloat((nuevoPagadoUsd * tasa).toFixed(2));
      } else {
        nuevoPagadoBs = parseFloat((nuevoPagadoBs + monto).toFixed(2));
        nuevoPagadoUsd = parseFloat((nuevoPagadoBs / tasa).toFixed(2));
      }

      const totalUsd = pedidoActual.items.reduce((acc, item) => {
        const cantidad = item.cantidad || 0;
        const precio = item.precioUsd ?? (item.precioBs && tasa ? item.precioBs / tasa : 0);
        return acc + cantidad * precio;
      }, 0);

      const nuevoEstado =
        nuevoPagadoUsd === 0 ? 'pendiente' :
        nuevoPagadoUsd < totalUsd ? 'abonado' : 'completado';

      const actualizado = {
        ...pedidoActual,
        pagadoUsd: nuevoPagadoUsd,
        pagadoBs: nuevoPagadoBs,
        estado: nuevoEstado
      };

      setPedidoActual(actualizado);
      setMontoAbonar('');
      setModalVisible(false);
    } else {
      Alert.alert('⚠️ Monto inválido', 'Ingresa un número mayor a 0');
    }
  };

  const modificarCantidad = (id, delta) => {
    const itemsActualizados = pedidoActual.items.map(item =>
      item.id === id
        ? { ...item, cantidad: Math.max(1, item.cantidad + delta) }
        : item
    );
    setPedidoActual(prev => ({
      ...prev,
      items: itemsActualizados
    }));
  };

  const eliminarPlatillo = (id) => {
    const itemsFiltrados = pedidoActual.items.filter(item => item.id !== id);
    setPedidoActual(prev => ({
      ...prev,
      items: itemsFiltrados
    }));
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

    setPedidoActual(prev => ({
      ...prev,
      items: itemsActualizados
    }));
    setSelectorVisible(false);
  };

  const guardarCambios = async () => {
    await actualizarPedido(pedidoActual);
    Alert.alert('✅ Pedido actualizado', 'Los cambios han sido guardados.');
    navigation.goBack();
  };

  const calcularTotales = () => {
    let totalUsd = 0;
    let totalBs = 0;

    pedidoActual.items.forEach(item => {
      const cantidad = item.cantidad || 0;
      const usd = item.precioUsd ?? (item.precioBs && tasa ? item.precioBs / tasa : 0);
      const bs = item.precioBs ?? (item.precioUsd && tasa ? item.precioUsd * tasa : 0);
      totalUsd += cantidad * usd;
      totalBs += cantidad * bs;
    });

    const pagadoUsd = pedidoActual.pagadoUsd || 0;
    const pagadoBs = pedidoActual.pagadoBs || 0;

    const pendienteUsd = Math.max(0, totalUsd - pagadoUsd);
    const pendienteBs = Math.max(0, totalBs - pagadoBs);

    const cambioUsd = pagadoUsd > totalUsd ? pagadoUsd - totalUsd : 0;
    const cambioBs = pagadoBs > totalBs ? pagadoBs - totalBs : 0;

    return {
      totalUsd: totalUsd.toFixed(2),
      totalBs: totalBs.toFixed(2),
      pagadoUsd: pagadoUsd.toFixed(2),
      pagadoBs: pagadoBs.toFixed(2),
      pendienteUsd: pendienteUsd.toFixed(2),
      pendienteBs: pendienteBs.toFixed(2),
      cambioUsd: cambioUsd.toFixed(2),
      cambioBs: cambioBs.toFixed(2)
    };
  };

  const resumen = calcularTotales();

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemNombre}>{item.nombre}</Text>
      <Text>Cantidad: {item.cantidad}</Text>
      <Text>Precio: ${item.precioUsd?.toFixed(2)} / Bs {item.precioBs?.toFixed(2)}</Text>
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
        <Text style={styles.total}>Total: ${resumen.totalUsd} / Bs {resumen.totalBs}</Text>
        <Text style={styles.pagado}>Pagado: ${resumen.pagadoUsd} / Bs {resumen.pagadoBs}</Text>
        {resumen.cambioUsd > 0 || resumen.cambioBs > 0 ? (
          <Text style={{ color: 'green' }}>Cambio: ${resumen.cambioUsd} / Bs {resumen.cambioBs}</Text>
        ) : (
          <Text style={styles.pendiente}>Pendiente: ${resumen.pendienteUsd} / Bs {resumen.pendienteBs}</Text>
        )}
      </View>

      {pedidoActual.estado !== 'completado' && (
  <TouchableOpacity
    style={styles.botonCompletar}
    onPress={() => {
      const totalUsd = pedidoActual.items.reduce((acc, item) => {
        const cantidad = item.cantidad || 0;
        const precio = item.precioUsd ?? (item.precioBs && tasa ? item.precioBs / tasa : 0);
        return acc + cantidad * precio;
      }, 0);

      const totalBs = parseFloat((totalUsd * tasa).toFixed(2));

      const actualizado = {
        ...pedidoActual,
        pagadoUsd: parseFloat(totalUsd.toFixed(2)),
        pagadoBs: totalBs,
        estado: 'completado'
      };

      setPedidoActual(actualizado);
      Alert.alert('✅ Pedido completado', 'El pedido ha sido marcado como pagado.');
    }}
  >
    <Text style={styles.botonTexto}>Completar Pedido</Text>
  </TouchableOpacity>
)}

      

      {pedidoActual.estado !== 'completado' && (
        <View style={styles.botonFila}>
          <TouchableOpacity style={styles.botonAbonar} onPress={() => setModalVisible(true)}>
            <Text style={styles.botonTexto}>Abonar</Text>
          </TouchableOpacity>

                   <TouchableOpacity style={styles.botonAgregar} onPress={() => setSelectorVisible(true)}>
            <Text style={styles.botonTexto}>Agregar Platillo</Text>
          </TouchableOpacity>
        </View>
      )}
      

      <TouchableOpacity style={styles.botonGuardar} onPress={guardarCambios}>
        <Text style={styles.botonTexto}>Guardar Cambios</Text>
      </TouchableOpacity>

      {/* Modal Abonar */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalFondo}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Monto a Abonar</Text>
            <Picker
              selectedValue={monedaAbono}
              onValueChange={(value) => setMonedaAbono(value)}
              style={styles.input}
            >
              <Picker.Item label="Dólares (USD)" value="usd" />
              <Picker.Item label="Bolívares (Bs)" value="bs" />
            </Picker>
            <TextInput
              style={styles.input}
              placeholder={`Ej: ${monedaAbono === 'usd' ? '10.00' : '400.00'}`}
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
                  <Picker.Item
                    key={p.id}
                    label={`${p.nombre} - $${p.precioUsd?.toFixed(2)}`}
                    value={p.id}
                  />
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
