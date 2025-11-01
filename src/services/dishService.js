// src/services/platillosService.js

// Importamos la instancia de Supabase que configuraste
import { supabase } from '../utils/supabase.js'; // Asegúrate de ajustar esta ruta

const PLATILLOS_TABLE = 'platillos'; // Nombre de la tabla en Supabase

// -----------------------------------------------------------------
// 1. CREAR PLATILLO (INSERTAR)
// -----------------------------------------------------------------
export const insertarPlatillo = async (platillo) => {
    // El objeto platillo debe contener: nombre, precio_usd, descripcion, imagen_url (opcional)
    const { data, error } = await supabase
        .from(PLATILLOS_TABLE)
        .insert([
            // Supabase genera automáticamente el 'id', 'created_at', y 'updated_at'.
            {
                nombre: platillo.nombre,
                precio_usd: platillo.precio_usd, // Asegúrate de pasar el precio en USD
                descripcion: platillo.descripcion || null,
                imagen_url: platillo.imagen_url || null,
                activo: true,
            }
        ])
        .select() // Pide que retorne el registro recién creado
        .single(); // Esperamos solo un registro

    if (error) {
        console.error('Error al insertar platillo:', error);
        throw new Error('No se pudo crear el platillo en la nube.');
    }
    
    // Retornamos el objeto completo con el ID generado por Supabase
    return data;
};

// ... en src/services/platillosService.js (Función obtenerPlatillos)

export const obtenerPlatillos = async () => {
    try {
        const { data, error } = await supabase
            .from(PLATILLOS_TABLE)
            .select('*')
            .order('nombre', { ascending: true });

        if (error) throw error;
        
        // **Mapeo de Supabase (snake_case) a la UI (camelCase)**
        return (data || []).map(platillo => ({
            ...platillo,
            id: platillo.id, 
            nombre: platillo.nombre,
            descripcion: platillo.descripcion,
            // Mapeo crucial para la lista de gestión
            precioUsd: platillo.precio_usd, 
            imagen: platillo.imagen_url,    
        }));
        
    } catch (error) {
        console.error('Error al obtener platillos:', error);
        return [];
    }
};



// -----------------------------------------------------------------
// 3. ACTUALIZAR PLATILLO (UPDATE)
// -----------------------------------------------------------------
export const actualizarPlatillo = async (id, platilloActualizado) => {
    // Usamos el 'id' generado por Supabase (UUID) para identificar el registro
    const { error } = await supabase
        .from(PLATILLOS_TABLE)
        .update({
            nombre: platilloActualizado.nombre,
            precio_usd: platilloActualizado.precio_usd,
            descripcion: platilloActualizado.descripcion || null,
            imagen_url: platilloActualizado.imagen_url || null,
            activo: platilloActualizado.activo, // Permitir actualizar el estado activo
            // 'updated_at' se actualiza automáticamente con el trigger SQL
        })
        .eq('id', id); // Condición: solo el registro con este ID

    if (error) {
        console.error('Error al actualizar platillo:', error);
        throw new Error('No se pudo actualizar el platillo en la nube.');
    }
};

// -----------------------------------------------------------------
// 4. ELIMINAR PLATILLO (DELETE)
// -----------------------------------------------------------------
export const eliminarPlatillo = async (id) => {
    // NOTA: En bases de datos, es mejor 'desactivar' que 'eliminar'
    // Aquí implementamos la eliminación física como lo tenías:
    const { error } = await supabase
        .from(PLATILLOS_TABLE)
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error al eliminar platillo:', error);
        // Si prefieres desactivar en lugar de borrar:
        // await supabase.from(PLATILLOS_TABLE).update({ activo: false }).eq('id', id);
        throw new Error('No se pudo eliminar el platillo de la nube.');
    }
};

// -----------------------------------------------------------------
// 5. BUSCAR PLATILLO POR NOMBRE (SELECT con Filtro)
// -----------------------------------------------------------------
export const buscarPlatilloPorNombre = async (nombre) => {
    const filtro = `%${nombre.toLowerCase()}%`; // Usamos % para buscar coincidencias parciales

    // Usamos 'ilike' para búsqueda insensible a mayúsculas/minúsculas en PostgreSQL
    const { data, error } = await supabase
        .from(PLATILLOS_TABLE)
        .select('*')
        .eq('activo', true)
        .ilike('nombre', filtro); 

    if (error) {
        console.error('Error al buscar platillos:', error);
        return [];
    }

    return data;
};

export const obtenerPlatilloPorId = async (id) => {
    try {
        const { data, error } = await supabase
            .from(PLATILLOS_TABLE)
            .select('*')
            .eq('id', id) // Condición: donde el ID coincida
            .single(); // Esperamos un único registro

        if (error) throw error;
        
        if (!data) {
            // Si no hay error de Supabase pero no se encuentra data (aunque single() debería manejar esto)
            throw new Error('Platillo no encontrado.'); 
        }

        // Mapeo: Aseguramos el formato camelCase para la UI
        return {
            ...data,
            id: data.id, 
            nombre: data.nombre,
            descripcion: data.descripcion,
            precioUsd: data.precio_usd,
            imagen: data.imagen_url,
            // 'activo' ya vendrá como booleano
        };

    } catch (error) {
        console.error('Error al obtener platillo por ID:', error);
        throw new Error(error.message || 'No se pudo cargar el platillo.');
    }
};