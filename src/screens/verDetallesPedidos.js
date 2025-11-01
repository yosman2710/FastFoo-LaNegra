import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    FlatList,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

// Asegúrate de importar desde las rutas correctas
import { 
    actualizarPedido, 
    registrarAbono, 
    obtenerPedidoPorId 
} from '../services/orderServices.js'; 

import { obtenerTasaDolar } from '../services/configService.js'; // Asumimos esta ruta
import { obtenerPlatillos } from '../services/dishService.js'; // Asumimos esta ruta
import { styles } from '../styles/verDetallesPedidos.style.js'; // Asumimos esta ruta

const PedidoDetalle = ({ route, navigation }) => {
    const pedidoId = route.params?.id; 

    const [menuDisponible, setMenuDisponible] = useState([]);
    const [tasa, setTasa] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [pedidoActual, setPedidoActual] = useState(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectorVisible, setSelectorVisible] = useState(false);
    const [montoAbonar, setMontoAbonar] = useState('');
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [monedaAbono, setMonedaAbono] = useState('usd');
    const [platilloSeleccionado, setPlatilloSeleccionado] = useState(null);

    useEffect(() => {
        const cargarDatos = async () => {
            if (!pedidoId) {
                Alert.alert("Error", "ID de pedido no proporcionado.");
                setIsLoading(false);
                navigation.goBack();
                return;
            }
            
            try {
                // *** 1. CARGA DEL PEDIDO FRESCO POR ID (Ya mapeado con precios) ***
                const pedidoFresco = await obtenerPedidoPorId(pedidoId);
                if (!pedidoFresco) throw new Error('Pedido no encontrado en la base de datos.');

                setPedidoActual({
                    ...pedidoFresco,
                    monto_abonado_usd: pedidoFresco.monto_abonado_usd ?? 0,
                    monto_abonado_bs: pedidoFresco.monto_abonado_bs ?? 0,
                });
                
                // 2. Cargar Platillos y Tasa
                const platillos = await obtenerPlatillos();
                setMenuDisponible(platillos);
                if (platillos.length > 0) setPlatilloSeleccionado(platillos[0].id);

                const valorTasaString = await obtenerTasaDolar();
                if (valorTasaString) setTasa(parseFloat(valorTasaString));
            } catch (error) {
                console.error("Error al cargar datos iniciales:", error);
                Alert.alert("Error", "No se pudieron cargar los datos iniciales.");
                navigation.goBack();
            } finally {
                setIsLoading(false);
            }
        };
        cargarDatos();
    }, [pedidoId]);

    // -------------------------------------------------------------
    // FUNCIÓN: Abonar
    // -------------------------------------------------------------
    const handleAbonar = async () => {
        // ... (Lógica de handleAbonar) ...
        const montoString = montoAbonar.trim().replace(',', '.');
        const monto = parseFloat(montoString);
        
        if (isNaN(monto) || monto <= 0 || !tasa) {
            Alert.alert('⚠️ Monto inválido', 'Ingresa un número mayor a 0 y verifica la tasa.');
            return;
        }

        try {
            const montoAbonoUSD = monedaAbono === 'usd' 
                ? monto 
                : parseFloat((monto / tasa).toFixed(2));

            await registrarAbono(pedidoActual.id, montoAbonoUSD, metodoPago);
            
            Alert.alert('✅ Abono Registrado', 'El pago se ha registrado en la nube.');
            navigation.goBack(); 

        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo registrar el abono.');
            console.error(error);
        } finally {
            setMontoAbonar('');
            setModalVisible(false);
        }
    };

    // -------------------------------------------------------------
    // FUNCIÓN: Guardar Cambios de Items
    // -------------------------------------------------------------
    const guardarCambios = async () => {
        const { totalUsd } = calcularTotales(); 
        
        const camposActualizados = {
            // Se asume que los items tienen precioUsd/precio_usd
            items: pedidoActual.items,
            total_usd: parseFloat(totalUsd),
        };
        
        try {
            await actualizarPedido(pedidoActual.id, camposActualizados);
            
            Alert.alert('✅ Pedido actualizado', 'Los cambios de ítems han sido guardados.');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'No se pudo guardar los cambios del pedido.');
            console.error(error);
        }
    };

    // -------------------------------------------------------------
    // FUNCIÓN: Calcular Totales (Usando los campos correctos)
    // -------------------------------------------------------------
    const calcularTotales = () => {
        let totalUsd = 0;
        let totalBs = 0;

        pedidoActual.items.forEach(item => {
            const cantidad = item.cantidad || 0;
            // **PUNTO CLAVE:** Accede al precio unitario mapeado o guardado
            const usd = item.precioUsd ?? item.precio_usd ?? 0; 
            const bs = tasa ? usd * tasa : 0;
            
            totalUsd += cantidad * usd;
            totalBs += cantidad * bs;
        });

        const pagadoUsd = pedidoActual.monto_abonado_usd || 0; 
        const pagadoBs = pedidoActual.monto_abonado_bs || 0;

        const pendienteUsd = Math.max(0, totalUsd - pagadoUsd);
        const pendienteBs = Math.max(0, totalBs - pagadoBs);

        const cambioUsd = pagadoUsd > totalUsd ? pagadoUsd - totalUsd : 0;
        const cambioBs = pagadoBs > totalBs ? pagadoBs - totalBs : 0;

        return {
            totalUsd: totalUsd, 
            totalBs: totalBs,
            pagadoUsd: pagadoUsd.toFixed(2),
            pagadoBs: pagadoBs.toFixed(2),
            pendienteUsd: pendienteUsd.toFixed(2),
            pendienteBs: pendienteBs.toFixed(2),
            cambioUsd: cambioUsd.toFixed(2),
            cambioBs: cambioBs.toFixed(2)
        };
    };

    // Lógica para añadir/modificar/eliminar platillos 
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
            : [...pedidoActual.items, { 
                ...platillo, 
                cantidad: 1, 
                // Aseguramos el nombre correcto para guardado en BD
                precio_usd: platillo.precio_usd, 
                // Aseguramos el nombre correcto para la UI
                precioUsd: platillo.precio_usd, 
                precioBs: platillo.precio_usd * tasa 
            }];

        setPedidoActual(prev => ({ ...prev, items: itemsActualizados }));
        setSelectorVisible(false);
    };

    // -------------------------------------------------------------
    // RENDERIZADO
    // -------------------------------------------------------------
    const resumen = pedidoActual ? calcularTotales() : {};

    const renderItem = ({ item }) => {
        const usd = item.precioUsd ?? item.precio_usd ?? 0;
        const totalItemUsd = (item.cantidad * usd).toFixed(2);
        const totalItemBs = tasa ? (item.cantidad * usd * tasa).toFixed(2) : 'N/A';
        
        return (
            <View style={styles.item}>
                <Text style={styles.itemNombre}>{item.nombre}</Text>
                {/* PRECIO UNITARIO SIN ASTERISCOS */}
                <Text>Precio Unitario: ${usd.toFixed(2)} / Bs {(usd * tasa).toFixed(2)}</Text>
                <Text>Cantidad: {item.cantidad}</Text>
                {/* TOTAL ITEM SIN ASTERISCOS */}
                <Text>Total Item: ${totalItemUsd} / Bs {totalItemBs}</Text> 
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
    };
    
    // Loader 
    if (isLoading || !tasa || !pedidoActual) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={{ marginTop: 10 }}>Cargando datos del pedido...</Text>
            </View>
        );
    }

    // El componente principal 
    return (
        <View style={styles.container}>
            <Text style={styles.header}>Pedido de {pedidoActual.clientName || pedidoActual.cliente_nombre}</Text>
            <Text style={styles.direccion}>{pedidoActual.clientAddress || pedidoActual.cliente_direccion}</Text>
            <Text style={styles.estado}>Estado: <Text style={styles.estadoValor}>{pedidoActual.estado}</Text></Text>

            <FlatList
                data={pedidoActual.items}
                keyExtractor={(item, index) => item.id + index}
                renderItem={renderItem}
                style={styles.lista}
            />

            <View style={styles.resumen}>
                {/* TOTAL SIN ASTERISCOS */}
                <Text style={styles.total}>Total: ${resumen.totalUsd.toFixed(2)} / Bs {resumen.totalBs.toFixed(2)}</Text>
                <Text style={styles.pagado}>Pagado: ${resumen.pagadoUsd} / Bs {resumen.pagadoBs}</Text>
                {resumen.cambioUsd > 0 || resumen.cambioBs > 0 ? (
                    <Text style={{ color: 'green' }}>Cambio: ${resumen.cambioUsd} / Bs {resumen.cambioBs}</Text>
                ) : (
                    <Text style={styles.pendiente}>Pendiente: ${resumen.pendienteUsd} / Bs {resumen.pendienteBs}</Text>
                )}
            </View>

            {/* BOTÓN COMPLETAR PEDIDO */}
            {pedidoActual.estado !== 'completado' && (
                <TouchableOpacity
                    style={styles.botonCompletar}
                    onPress={async () => {
                        const montoPendienteUSD = parseFloat(resumen.pendienteUsd);
                        
                        if (montoPendienteUSD > 0) {
                            await registrarAbono(pedidoActual.id, montoPendienteUSD, 'cierre_automatico');
                            Alert.alert('✅ Pedido completado', 'El saldo pendiente ha sido saldado.');
                        } else if (pedidoActual.estado !== 'completado') {
                            await actualizarPedido(pedidoActual.id, { estado: 'completado' });
                            Alert.alert('✅ Pedido completado', 'El pedido ha sido marcado como completado.');
                        }
                        navigation.goBack(); 
                    }}
                >
                    <Text style={styles.botonTexto}>Completar Pedido</Text>
                </TouchableOpacity>
            )}

            {/* BOTONES ABONAR Y AGREGAR */}
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
            
            {/* BOTÓN GUARDAR CAMBIOS */}
            <TouchableOpacity style={styles.botonGuardar} onPress={guardarCambios}>
                <Text style={styles.botonTexto}>Guardar Cambios</Text>
            </TouchableOpacity>

            {/* MODALES */}
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