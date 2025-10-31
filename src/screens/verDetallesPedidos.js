import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    FlatList,
    Alert,
    ActivityIndicator // Añadido para el estado de carga
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
// ELIMINAMOS: import AsyncStorage from '@react-native-async-storage/async-storage';

// Importamos servicios de Supabase
import { actualizarPedido, registrarAbono } from '../services/orderServices.js'; // Usar actualizarPedido para items

import { obtenerTasaDolar } from '../services/configService.js';
import { obtenerPlatillos } from '../services/dishService.js';
import { styles } from '../styles/verDetallesPedidos.style.js';

const PedidoDetalle = ({ route, navigation }) => {
    // Los datos del pedido vienen de GestionPedidos (ya sincronizado)
    const { pedido } = route.params;

    const [menuDisponible, setMenuDisponible] = useState([]);
    const [tasa, setTasa] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Inicialización del estado con los nombres de columna de la BD (snake_case)
    const [pedidoActual, setPedidoActual] = useState({
        ...pedido,
        // Usamos los campos de la BD para la fuente de verdad (ej: total_usd)
        pagado_usd: pedido.monto_abonado_usd ?? 0,
        pagado_bs: pedido.monto_abonado_bs ?? 0,
        // clientName/clientAddress es solo para la UI, usamos cliente_nombre de la BD
    });

    const [modalVisible, setModalVisible] = useState(false);
    const [selectorVisible, setSelectorVisible] = useState(false);
    const [montoAbonar, setMontoAbonar] = useState('');
    const [metodoPago, setMetodoPago] = useState('efectivo'); // Nuevo campo requerido para registrarAbono
    const [monedaAbono, setMonedaAbono] = useState('usd');
    const [platilloSeleccionado, setPlatilloSeleccionado] = useState(null);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // 1. Cargar Platillos desde Supabase
                const platillos = await obtenerPlatillos();
                setMenuDisponible(platillos);
                if (platillos.length > 0) setPlatilloSeleccionado(platillos[0].id);

                // 2. Cargar Tasa de Dólar desde Supabase
                const valorTasaString = await obtenerTasaDolar();
                if (valorTasaString) setTasa(parseFloat(valorTasaString));
            } catch (error) {
                console.error("Error al cargar datos iniciales:", error);
                Alert.alert("Error", "No se pudieron cargar los datos de menú o la tasa.");
            } finally {
                setIsLoading(false);
            }
        };
        cargarDatos();
    }, []);

    // -------------------------------------------------------------
    // FUNCIÓN CRUCIAL MIGRADA: Abonar
    // -------------------------------------------------------------
    const handleAbonar = async () => {
        const montoString = montoAbonar.trim().replace(',', '.');
        const monto = parseFloat(montoString);
        
        if (isNaN(monto) || monto <= 0 || !tasa) {
            Alert.alert('⚠️ Monto inválido', 'Ingresa un número mayor a 0 y verifica la tasa.');
            return;
        }

        try {
            // 1. Convertir el monto del abono a USD
            const montoAbonoUSD = monedaAbono === 'usd' 
                ? monto 
                : parseFloat((monto / tasa).toFixed(2));

            // 2. Llamar al servicio de Supabase (registrarAbono)
            await registrarAbono(pedidoActual.id, montoAbonoUSD, metodoPago);
            
            Alert.alert('✅ Abono Registrado', 'El pago se ha registrado en la nube.');

            // NOTA: Para obtener el estado actualizado, idealmente deberías recargar el pedido 
            // o confiar en que el Realtime de la pantalla anterior lo actualizará. 
            // Por simplicidad, navegaremos hacia atrás.
            navigation.goBack(); 

        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo registrar el abono.');
            console.error(error);
        } finally {
            setMontoAbonar('');
            setModalVisible(false);
        }
    };

    // La lógica de modificación de ítems (local) se mantiene igual, 
    // pero los cambios deben ser guardados en la BD.
    
    // -------------------------------------------------------------
    // FUNCIÓN CRUCIAL MIGRADA: Guardar Cambios
    // -------------------------------------------------------------
    const guardarCambios = async () => {
        // 1. Recalcular el total USD del pedido basado en los items actualizados
        const { totalUsd } = calcularTotales();
        
        // 2. Preparar los datos para Supabase (usando snake_case)
        const camposActualizados = {
            items: pedidoActual.items,
            total_usd: parseFloat(totalUsd),
            // No actualizamos pagado_usd, pagado_bs, ni estado aquí. 
            // Esos campos solo deben ser actualizados por registrarAbono 
            // o por el botón 'Completar Pedido'.
        };
        
        try {
            // Llamar al servicio de actualización
            await actualizarPedido(pedidoActual.id, camposActualizados);
            
            Alert.alert('✅ Pedido actualizado', 'Los cambios de ítems han sido guardados en la nube.');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'No se pudo guardar los cambios del pedido.');
            console.error(error);
        }
    };

    // -------------------------------------------------------------
    // Calcular Totales (Se mantiene la lógica de cálculo local)
    // -------------------------------------------------------------
    const calcularTotales = () => {
        let totalUsd = 0;
        let totalBs = 0;

        pedidoActual.items.forEach(item => {
            const cantidad = item.cantidad || 0;
            // Usamos precio_usd de la BD, mapeado a precioUsd. Si no está, lo calculamos.
            const usd = item.precioUsd ?? (item.precio_usd) ?? 0; 
            const bs = item.precioBs ?? (tasa ? usd * tasa : 0);
            
            totalUsd += cantidad * usd;
            totalBs += cantidad * bs;
        });

        // Usamos los campos de la BD para el abono
        const pagadoUsd = pedidoActual.monto_abonado_usd || 0; 
        const pagadoBs = pedidoActual.monto_abonado_bs || 0;

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

    // Lógica para añadir/modificar/eliminar platillos (se mantiene)
    const modificarCantidad = (id, delta) => {
        const itemsActualizados = pedidoActual.items.map(item =>
            item.id === id
                ? { ...item, cantidad: Math.max(1, item.cantidad + delta) }
                : item
        );
        setPedidoActual(prev => ({ ...prev, items: itemsActualizados }));
    };

    const eliminarPlatillo = (id) => {
        const itemsFiltrados = pedidoActual.items.filter(item => item.id !== id);
        setPedidoActual(prev => ({ ...prev, items: itemsFiltrados }));
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
            : [...pedidoActual.items, { ...platillo, cantidad: 1, precioUsd: platillo.precio_usd, precioBs: platillo.precio_usd * tasa }]; // Aseguramos que tenga los precios correctos

        setPedidoActual(prev => ({ ...prev, items: itemsActualizados }));
        setSelectorVisible(false);
    };

    // -------------------------------------------------------------
    // Lógica de Renderizado
    // -------------------------------------------------------------
    const resumen = calcularTotales();

    const renderItem = ({ item }) => (
        <View style={styles.item}>
            <Text style={styles.itemNombre}>{item.nombre}</Text>
            <Text>Cantidad: {item.cantidad}</Text>
            {/* Usamos los campos de la BD o los calculados/mapeados */}
            <Text>Precio: ${item.precioUsd?.toFixed(2) ?? item.precio_usd?.toFixed(2)} / Bs {item.precioBs?.toFixed(2) ?? item.total_bs?.toFixed(2)}</Text> 
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
    
    // Si la tasa no se cargó, la aplicación no debería funcionar correctamente
    if (isLoading || !tasa) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={{ marginTop: 10 }}>Cargando datos del pedido...</Text>
            </View>
        );
    }


    return (
        <View style={styles.container}>
            <Text style={styles.header}>Pedido de {pedidoActual.clientName || pedidoActual.cliente_nombre}</Text>
            <Text style={styles.direccion}>{pedidoActual.clientAddress || pedidoActual.cliente_direccion}</Text>
            {/* El estado es el campo de la BD (pendiente/abonado/completado) */}
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
                    onPress={async () => {
                        // Abona el monto pendiente para completar el pago de forma automática
                        const montoPendienteUSD = parseFloat(resumen.pendienteUsd);
                        
                        if (montoPendienteUSD > 0) {
                            await registrarAbono(pedidoActual.id, montoPendienteUSD, 'cierre_automatico');
                            Alert.alert('✅ Pedido completado', 'El saldo pendiente ha sido saldado y el pedido completado.');
                            navigation.goBack(); 
                        } else {
                            // Si el monto pendiente es 0, simplemente lo marcamos como completado si no lo está
                            await actualizarPedido(pedidoActual.id, { estado: 'completado' });
                            Alert.alert('✅ Pedido completado', 'El pedido ha sido marcado como completado.');
                            navigation.goBack();
                        }
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
                        {/* Nuevo Picker para Método de Pago */}
                         <Picker
                            selectedValue={metodoPago}
                            onValueChange={(value) => setMetodoPago(value)}
                            style={styles.input}
                        >
                            <Picker.Item label="Efectivo" value="efectivo" />
                            <Picker.Item label="Transferencia" value="transferencia" />
                            <Picker.Item label="Punto de Venta" value="punto" />
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
                            <TouchableOpacity onPress={handleAbonar}>
                                <Text style={styles.aceptar}>Aceptar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal Selector de Platillo (sin cambios) */}
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
                                        label={`${p.nombre} - $${p.precio_usd?.toFixed(2)}`}
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