// src/services/platillosService.js
import { getData, storeData } from '../utils/storage';

const PLATILLOS_KEY = 'platillos';

export const insertarPlatillo = async (platillo) => {
  const platillos = await getData(PLATILLOS_KEY) || [];
  const nuevo = { ...platillo, id: Date.now().toString() };
  platillos.push(nuevo);
  await storeData(PLATILLOS_KEY, platillos);
  return nuevo;
};

export const obtenerPlatillos = async () => {
  return await getData(PLATILLOS_KEY) || [];
};

export const actualizarPlatillo = async (id, platilloActualizado) => {
  const platillos = await getData(PLATILLOS_KEY) || [];
  const nuevaLista = platillos.map(p => p.id === id ? platilloActualizado : p);
  await storeData(PLATILLOS_KEY, nuevaLista);
};

export const eliminarPlatillo = async (id) => {
  const platillos = await getData(PLATILLOS_KEY) || [];
  const filtrados = platillos.filter(p => p.id !== id);
  await storeData(PLATILLOS_KEY, filtrados);
};
export const obtenerPlatilloPorId = async (id) => {
  const platillos = await getData(PLATILLOS_KEY) || [];
  return platillos.find(p => p.id === id) || null;
};
export const buscarPlatilloPorNombre = async (nombre) => {
  const platillos = await obtenerPlatillos();
  const filtro = nombre.toLowerCase();
  return platillos.filter(p => p.nombre.toLowerCase().includes(filtro));
};

