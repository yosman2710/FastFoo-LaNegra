import AsyncStorage from '@react-native-async-storage/async-storage';

const PEDIDOS_KEY = 'pedidos_app';

export const guardarPedido = async (nuevoPedido) => {
  try {
    const pedidosExistentes = await obtenerPedidos();
    const actualizados = [...pedidosExistentes, nuevoPedido];
    await AsyncStorage.setItem(PEDIDOS_KEY, JSON.stringify(actualizados));
  } catch (error) {
    console.error('Error al guardar el pedido:', error);
  }
};

export const obtenerPedidos = async () => {
  try {
    const json = await AsyncStorage.getItem(PEDIDOS_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Error al obtener los pedidos:', error);
    return [];
  }
};

export const actualizarPedido = async (pedidoActualizado) => {
  try {
    const pedidos = await obtenerPedidos();
    const nuevos = pedidos.map(p =>
      p.id === pedidoActualizado.id ? pedidoActualizado : p
    );
    await AsyncStorage.setItem(PEDIDOS_KEY, JSON.stringify(nuevos));
  } catch (error) {
    console.error('Error al actualizar el pedido:', error);
  }
};

export const limpiarPedidos = async () => {
  try {
    await AsyncStorage.removeItem(PEDIDOS_KEY);
  } catch (error) {
    console.error('Error al limpiar los pedidos:', error);
  }
};
