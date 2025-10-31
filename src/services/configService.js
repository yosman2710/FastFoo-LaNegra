// src/services/configService.js

import { supabase } from '../lib/supabase'; // Asegúrate de que esta ruta a tu cliente Supabase sea correcta

const CONFIG_TABLE = 'configuracion';
const TASA_CLAVE = 'tasa_dolar';

// -----------------------------------------------------------------
// 1. OBTENER TASA (SELECT)
// -----------------------------------------------------------------
/**
 * Obtiene la tasa de dólar actual almacenada en la base de datos.
 * @returns {Promise<string>} La tasa de dólar como una cadena (ej. '36.50').
 */
export const obtenerTasaDolar = async () => {
    try {
        const { data, error } = await supabase
            .from(CONFIG_TABLE)
            .select('valor')
            .eq('clave', TASA_CLAVE)
            .single();

        if (error) {
             // Si no encuentra la clave (ej. primera vez), devuelve un valor por defecto
            if (error.code === 'PGRST116' || error.message.includes('found 0 rows')) {
                // Podríamos insertar la fila si no existe, pero por ahora devolvemos un valor seguro.
                return '36.50'; 
            }
            throw error;
        }

        return data.valor; // Devuelve la tasa como string (ej. '36.50')

    } catch (error) {
        console.error('Error al obtener la tasa de dólar:', error);
        // Valor de reserva en caso de fallo de conexión/consulta
        return '36.50'; 
    }
};

// -----------------------------------------------------------------
// 2. ACTUALIZAR TASA (UPDATE)
// -----------------------------------------------------------------
/**
 * Actualiza la tasa de dólar en la base de datos.
 * @param {string} nuevaTasaString - La nueva tasa de dólar a guardar (como string).
 */
export const actualizarTasaDolar = async (nuevaTasaString) => {
    try {
        const { error } = await supabase
            .from(CONFIG_TABLE)
            .update({ valor: nuevaTasaString })
            .eq('clave', TASA_CLAVE);

        if (error) throw error;

    } catch (error) {
        console.error('Error al actualizar la tasa de dólar:', error);
        throw new Error('No se pudo actualizar la tasa en la nube.');
    }
};