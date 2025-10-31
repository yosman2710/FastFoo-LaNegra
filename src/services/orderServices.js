// src/services/pedidosService.js

import { supabase } from '../utils/supabase.js'; // Asegúrate de la ruta correcta

const PEDIDOS_TABLE = 'pedidos';
const CONFIG_TABLE = 'configuracion';

// -----------------------------------------------------------------
// FUNCIÓN AUXILIAR: Obtener la Tasa de Dólar actual
// -----------------------------------------------------------------
const getTasaDolar = async () => {
    const { data, error } = await supabase
        .from(CONFIG_TABLE)
        .select('valor')
        .eq('clave', 'tasa_dolar')
        .single();
    
    if (error) {
        console.error('Error al obtener la tasa de dólar:', error);
        // Usar un valor por defecto o lanzar error si la app no puede funcionar sin él
        return 36.50; 
    }
    // Aseguramos que el valor sea un número decimal
    return parseFloat(data.valor);
}

// -----------------------------------------------------------------
// 1. CREAR PEDIDO (INSERTAR) - Reemplaza guardarPedido
// -----------------------------------------------------------------
export const guardarPedido = async (datosPedido) => {
    try {
        // 1. Obtener la tasa de dólar actual
        const tasa = await getTasaDolar();
        
        // 2. Calcular totales (asumiendo que total_usd viene pre-calculado)
        const totalUSD = datosPedido.total_usd;
        const totalBS = totalUSD * tasa;
        
        // 3. Insertar en la tabla 'pedidos'
        const { data, error } = await supabase
            .from(PEDIDOS_TABLE)
            .insert([
                {
                    cliente_nombre: datosPedido.cliente_nombre,
                    cliente_direccion: datosPedido.cliente_direccion || null,
                    items: datosPedido.items, // JSONB: lista de platillos y cantidades
                    total_usd: totalUSD,
                    total_bs: totalBS,
                    tasa_dolar_usada: tasa,
                    estado: 'pendiente', // Estado inicial
                    monto_abonado_usd: 0.00, // Empieza en cero
                    monto_abonado_bs: 0.00,  // Empieza en cero
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
        
    } catch (error) {
        console.error('Error al guardar el pedido en Supabase:', error);
        throw new Error('No se pudo crear el pedido.');
    }
};

// -----------------------------------------------------------------
// 2. OBTENER PEDIDOS (SELECT)
// -----------------------------------------------------------------
export const obtenerPedidos = async () => {
    try {
        const { data, error } = await supabase
            .from(PEDIDOS_TABLE)
            .select('*')
            .order('created_at', { ascending: false }); // Mostrar los más recientes primero

        if (error) throw error;
        return data || [];
        
    } catch (error) {
        console.error('Error al obtener los pedidos de Supabase:', error);
        return [];
    }
};

// -----------------------------------------------------------------
// 3. ACTUALIZAR PEDIDO (General) - Reemplaza actualizarPedido
// -----------------------------------------------------------------
export const actualizarPedido = async (pedidoId, camposActualizados) => {
    try {
        const { error } = await supabase
            .from(PEDIDOS_TABLE)
            .update(camposActualizados) // Ejemplo: { estado: 'cancelado', cliente_direccion: 'Nueva Dir.' }
            .eq('id', pedidoId);

        if (error) throw error;
        
    } catch (error) {
        console.error('Error al actualizar el pedido:', error);
        throw new Error('No se pudo actualizar el pedido.');
    }
};

// -----------------------------------------------------------------
// 4. FUNCION CLAVE: ABONAR DINERO A UN PEDIDO
// *Se ajustaron los nombres de estado para mantener la coherencia con el frontend.*
// -----------------------------------------------------------------
export const registrarAbono = async (pedidoId, montoAbonoUSD, metodoPago) => {
    try {
        // 1. Obtener el pedido actual para sus totales y tasa
        const { data: pedidoActual, error: fetchError } = await supabase
            .from(PEDIDOS_TABLE)
            .select('*')
            .eq('id', pedidoId)
            .single();

        if (fetchError || !pedidoActual) throw fetchError || new Error('Pedido no encontrado');

        // 2. Calcular monto en Bolívares y nueva tasa (usando la tasa del pedido original)
        const tasaUsada = pedidoActual.tasa_dolar_usada;
        const montoAbonoBS = montoAbonoUSD * tasaUsada;
        
        // 3. Calcular nuevos totales abonados
        const nuevoAbonadoUSD = pedidoActual.monto_abonado_usd + montoAbonoUSD;
        const nuevoAbonadoBS = pedidoActual.monto_abonado_bs + montoAbonoBS;
        
        // 4. Determinar el nuevo estado (AJUSTE AQUÍ)
        let nuevoEstado = pedidoActual.estado;
        if (nuevoAbonadoUSD >= pedidoActual.total_usd) {
            nuevoEstado = 'completado'; // Usar 'completado'
        } else if (nuevoAbonadoUSD > 0) {
            nuevoEstado = 'abonado'; // Usar 'abonado'
        }

        // 5. Actualizar el pedido principal con el nuevo abono y estado
        const { error: updateError } = await supabase
            .from(PEDIDOS_TABLE)
            .update({
                monto_abonado_usd: nuevoAbonadoUSD,
                monto_abonado_bs: nuevoAbonadoBS,
                estado: nuevoEstado,
            })
            .eq('id', pedidoId);

        if (updateError) throw updateError;
        
        // OPCIONAL: Insertar el registro detallado en 'abonos_pedido'
        await supabase
            .from('abonos_pedido')
            .insert({
                pedido_id: pedidoId,
                monto_usd: montoAbonoUSD,
                monto_bs: montoAbonoBS,
                tasa_dolar_usada: tasaUsada,
                metodo_pago: metodoPago,
            });

    } catch (error) {
        console.error('Error al registrar abono:', error);
        throw new Error('No se pudo procesar el abono.');
    }
};

// -----------------------------------------------------------------
// 5. ELIMINAR PEDIDO (Implementación para la UI)
// -----------------------------------------------------------------
export const eliminarPedido = async (pedidoId) => {
    try {
        const { error } = await supabase
            .from(PEDIDOS_TABLE)
            .delete()
            .eq('id', pedidoId);

        if (error) throw error;
        
    } catch (error) {
        console.error('Error al eliminar el pedido:', error);
        throw new Error('No se pudo eliminar el pedido de la base de datos.');
    }
};


// -----------------------------------------------------------------
// 6. LIMPIAR PEDIDOS (ELIMINAR TODOS) - Reemplaza limpiarPedidos
// -----------------------------------------------------------------
export const limpiarPedidos = async () => {
    // ESTO ELIMINA *TODOS* LOS PEDIDOS. ¡Úsalo con extrema precaución!
    try {
        const { error } = await supabase
            .from(PEDIDOS_TABLE)
            .delete()
            .neq('estado', 'eliminado_simulado'); // Condición que debe ser verdadera para todos (si no existe un estado así)

        if (error) throw error;
        
    } catch (error) {
        console.error('Error al limpiar los pedidos:', error);
        throw new Error('No se pudieron limpiar los pedidos de la base de datos.');
    }
};