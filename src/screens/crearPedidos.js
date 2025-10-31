import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    Alert
} from 'react-native';
// ELIMINAMOS: import AsyncStorage from '@react-native-async-storage/async-storage'; 

// Importamos las funciones de servicio actualizadas:
import { obtenerPlatillos } from '../services/dishService.js'; // Usamos el nombre correcto
import { guardarPedido } from '../services/orderServices.js';     // Usamos el nombre correcto
import { obtenerTasaDolar } from '../services/configService.js';    // Nuevo servicio para la tasa

import { styles } from '../styles/crearPedidos.style.js';

const CrearPedido = ({ navigation }) => {
    const [platillos, setPlatillos] = useState([]);
    const [cantidades, setCantidades] = useState({});
    const [cliente, setCliente] = useState('');
    const [direccion, setDireccion] = useState('');
    const [tasa, setTasa] = useState(null); // Tasa obtenida de la nube

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // 1. Cargar Platillos desde Supabase
                const data = await obtenerPlatillos();
                setPlatillos(data);
                
                const inicial = {};
                data.forEach(p => { inicial[p.id] = 0; });
                setCantidades(inicial);

                // 2. Cargar Tasa de Dólar desde Supabase
                const valorTasaString = await obtenerTasaDolar();
                setTasa(parseFloat(valorTasaString)); 

            } catch (error) {
                console.error('Error al cargar datos iniciales:', error);
                Alert.alert('Error', 'No se pudieron cargar los datos de platillos o la tasa.');
            }
        };
        cargarDatos();
    }, []);

    const incrementar = (id) => {
        setCantidades(prev => ({ ...prev, [id]: prev[id] + 1 }));
    };

    const decrementar = (id) => {
        setCantidades(prev => ({ ...prev, [id]: Math.max(prev[id] - 1, 0) }));
    };

    // FUNCIÓN CLAVE: Ahora el cálculo se basa en precio_usd y la tasa actual
    const calcularTotal = () => {
        if (tasa === null) return { usd: '0.00', bs: '0.00' };

        let totalUsd = 0;
        
        platillos.forEach(p => {
            const cantidad = cantidades[p.id] || 0;
            // Usamos la columna precio_usd (precio base) que viene de Supabase
            const usd = p.precio_usd || 0; 
            totalUsd += cantidad * usd;
        });
        
        const totalBs = totalUsd * tasa;

        return {
            usd: totalUsd.toFixed(2),
            bs: totalBs.toFixed(2)
        };
    };

    const confirmarPedido = async () => {
        // 1. Preparar la lista de ítems para JSONB (solo con los datos que necesitamos)
        const items = platillos
            .filter(p => cantidades[p.id] > 0)
            .map(p => ({
                id: p.id,
                nombre: p.nombre,
                // Incluimos el precio en USD al momento de la compra
                precio_unitario_usd: p.precio_usd, 
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

        // 2. Preparar el objeto para la función guardarPedido
        // Ya no necesitamos calcular totalBs, status, etc., en el cliente, 
        // ya que la función del servicio lo hace
        const nuevoPedido = {
            cliente_nombre: cliente,
            cliente_direccion: direccion,
            items: items, // Lista de ítems con cantidades y precios USD
            total_usd: parseFloat(total.usd),
        };

        try {
            // 3. Guardar en la nube. La función 'guardarPedido' se encarga de:
            //    - Obtener la tasa de la nube.
            //    - Calcular total_bs.
            //    - Insertar en la tabla 'pedidos'.
            await guardarPedido(nuevoPedido);
            
            Alert.alert('✅ Éxito', 'Pedido creado y guardado en la nube exitosamente');
            
            // Limpiar y volver
            setCliente('');
            setDireccion('');
            setCantidades({});
            navigation.goBack();
            
        } catch (error) {
            console.error('Error al guardar pedido:', error);
            Alert.alert('Error', 'Hubo un problema al guardar el pedido en Supabase.');
        }
    };

    const renderItem = ({ item }) => {
        // Obtenemos el precio en Bolívares en tiempo real para la UI
        const precioBsCalculado = tasa ? (item.precio_usd * tasa).toFixed(2) : '...';
        
        return (
            <View style={styles.item}>
                <Text style={styles.nombre}>{item.nombre}</Text>
                <Text style={styles.precio}>
                    ${item.precio_usd?.toFixed(2)} / Bs {precioBsCalculado}
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
    };

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
                placeholder="Dirección del cliente (Opcional)"
                value={direccion}
                onChangeText={setDireccion}
            />

            <FlatList
                style={styles.listaPlatillos}
                data={platillos}
                // Usamos el ID de Supabase, que ya es string (UUID)
                keyExtractor={(item) => item.id} 
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