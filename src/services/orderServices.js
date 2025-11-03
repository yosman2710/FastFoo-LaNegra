/// src/services/pedidosService.js

import { supabase } from '../utils/supabase.js'; 

const PEDIDOS_TABLE = 'pedidos';
const CONFIG_TABLE = 'configuracion';
const PLATILLOS_TABLE = 'platillos';

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
        return 36.50; 
    }
    return parseFloat(data.valor);
}

// -----------------------------------------------------------------
// 1. CREAR PEDIDO (INSERTAR) - Revisado
// Nota: Se asume que datosPedido.items ya incluye el precio unitario
//       como 'precio_usd' al venir de CrearPedido.js.
// -----------------------------------------------------------------
export const guardarPedido = async (datosPedido) => {
    try {
        const tasa = await getTasaDolar();
        
        const totalUSD = datosPedido.total_usd;
        const totalBS = totalUSD * tasa;
        
        // 3. Insertar en la tabla 'pedidos'
        const { data, error } = await supabase
            .from(PEDIDOS_TABLE)
            .insert([
                {
                    cliente_nombre: datosPedido.cliente_nombre,
                    items: datosPedido.items, // JSONB: Se espera que cada item tenga 'precio_usd'
                    total_usd: totalUSD,
                    total_bs: totalBS,
                    tasa_dolar_usada: tasa,
                    estado: 'pendiente', 
                    monto_abonado_usd: 0.00, 
                    monto_abonado_bs: 0.00,  
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
    const { data, error } = await supabase
        .from('pedidos') // Asegúrate de que este es el nombre de tu tabla
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    
    // CORRECCIÓN CLAVE: Mapear y asegurar que los campos de totales no sean nulos
    return (data || []).map(pedido => ({
        ...pedido,
        id: pedido.id, 
        clientName: pedido.cliente_nombre, 
        totalUsd: pedido.total_usd || 0, 
        pagadoUsd: pedido.monto_abonado_usd || 0, 
        pagadoBs: pedido.monto_abonado_bs || 0,
    }));
};


// -----------------------------------------------------------------
// 4. ACTUALIZAR PEDIDO (General) 
// -----------------------------------------------------------------
export const actualizarPedido = async (pedidoId, camposActualizados) => {
    try {
        const { error } = await supabase
            .from(PEDIDOS_TABLE)
            .update(camposActualizados)
            .eq('id', pedidoId);

        if (error) throw error;
        
    } catch (error) {
        console.error('Error al actualizar el pedido:', error);
        throw new Error('No se pudo actualizar el pedido.');
    }
};

// -----------------------------------------------------------------
// 5. FUNCION CLAVE: ABONAR DINERO A UN PEDIDO
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
        
        // 4. Determinar el nuevo estado
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
// 6. ELIMINAR PEDIDO (Implementación para la UI)
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
// 7. LIMPIAR PEDIDOS (ELIMINAR TODOS)
// -----------------------------------------------------------------
export const limpiarPedidos = async () => {
    try {
        const { error } = await supabase
            .from(PEDIDOS_TABLE)
            .delete()
            .neq('estado', 'eliminado_simulado'); 

        if (error) throw error;
        
    } catch (error) {
        console.error('Error al limpiar los pedidos:', error);
        throw new Error('No se pudieron limpiar los pedidos de la base de datos.');
    }
};

export const obtenerPedidoPorId = async (id) => {
    try {
        // 1. Obtener el pedido de la tabla 'pedidos'
        const { data: pedidoData, error: fetchError } = await supabase
            .from(PEDIDOS_TABLE)
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !pedidoData) throw fetchError || new Error('Pedido no encontrado');

        const tasaHistorica = pedidoData.tasa_dolar_usada || 1; 
        const itemIds = pedidoData.items.map(item => item.id);
        
        // 2. Obtener los precios frescos de los platillos desde la fuente de verdad
        const { data: platillosData, error: platillosError } = await supabase
    .from(PLATILLOS_TABLE)
    .select('id, precio_usd') // <--- Usa SOLO el nombre de columna que estás 100% seguro que existe.
    .in('id', itemIds);

        if (platillosError) {
            console.warn("Advertencia: No se pudieron obtener los precios frescos de los platillos. Usando precios guardados.");
            // Si falla la consulta de platillos, continuamos con el precio guardado en el JSON.
        }

        // Crear un mapa para buscar precios rápidamente
        const platillosMap = (platillosData || []).reduce((acc, platillo) => {
            // Usamos 'precio_usd' o 'monto_usd' como fuente de verdad
            const precio = platillo.precio_usd || platillo.monto_usd || 0; 
            acc[platillo.id] = precio;
            return acc;
        }, {});


        // 3. Fusionar la data del pedido con los precios frescos
        const itemsMapeados = pedidoData.items.map(item => {
            // Precio fresco de la tabla platillos, o precio guardado si no se encuentra el platillo.
            const precioUSD = platillosMap[item.id] || item.precio_usd || item.precioUsd || 0; 
            
            return {
                ...item,
                // Garantizamos que la UI acceda a este campo
                precioUsd: precioUSD, 
                // Usamos la tasa del pedido (es la tasa histórica al momento de la compra)
                precioBs: precioUSD * tasaHistorica, 
            };
        });

        // 4. Mapear y retornar el pedido completo con ítems corregidos
        return {
            ...pedidoData,
            items: itemsMapeados, 
            clientName: pedidoData.cliente_nombre,
            totalUsd: pedidoData.total_usd,
            pagadoUsd: pedidoData.monto_abonado_usd,
            pagadoBs: pedidoData.monto_abonado_bs,
        };
        
    } catch (error) {
        console.error('Error al obtener el pedido por ID:', error);
        throw new Error('Error al cargar los datos del pedido.');
    }
};