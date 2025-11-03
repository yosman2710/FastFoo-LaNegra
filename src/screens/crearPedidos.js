import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    Alert,
    SafeAreaView // 🛑 Añadido para mejor UI/UX
} from 'react-native';

// Importamos las funciones de servicio actualizadas:
import { obtenerPlatillos } from '../services/dishService.js'; 
import { guardarPedido } from '../services/orderServices.js'; 
import { obtenerTasaDolar } from '../services/configService.js'; 
import { styles } from '../styles/crearPedidos.style.js';

const CrearPedido = ({ navigation }) => {
    const [platillos, setPlatillos] = useState([]);
    const [cantidades, setCantidades] = useState({});
    const [cliente, setCliente] = useState('');
    // 🛑 NUEVO: Estado para el término de búsqueda de platillos
    const [busqueda, setBusqueda] = useState(''); 
    // 🛑 ELIMINADO: Ya no se usa el estado de dirección
    const [tasa, setTasa] = useState(null); 

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

    const calcularTotal = () => {
        if (tasa === null) return { usd: '0.00', bs: '0.00' };

        let totalUsd = 0;
        
        // Iterar sobre la lista COMPLETA de platillos
        platillos.forEach(p => {
            const cantidad = cantidades[p.id] || 0;
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
        // 1. Preparar la lista de ítems para JSONB
        const items = platillos
            .filter(p => cantidades[p.id] > 0)
            .map(p => ({
                id: p.id,
                nombre: p.nombre,
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
        const nuevoPedido = {
            cliente_nombre: cliente,
            items: items, 
            total_usd: parseFloat(total.usd),
        };

        try {
            await guardarPedido(nuevoPedido);
            
            Alert.alert('✅ Éxito', 'Pedido creado y guardado en la nube exitosamente');
            
            // Limpiar y volver
            setCliente('');
            setCantidades({});
            navigation.goBack();
            
        } catch (error) {
            console.error('Error al guardar pedido:', error);
            Alert.alert('Error', 'Hubo un problema al guardar el pedido en Supabase.');
        }
    };

    // 🛑 NUEVO: Función para filtrar platillos localmente por nombre
    const platillosFiltrados = () => {
        if (!busqueda.trim()) {
            return platillos;
        }
        const lowerCaseBusqueda = busqueda.toLowerCase().trim();
        return platillos.filter(p => 
            p.nombre?.toLowerCase().includes(lowerCaseBusqueda)
        );
    };

    const renderItem = ({ item }) => {
        // Obtenemos el precio en Bolívares en tiempo real para la UI
        const precioBsCalculado = tasa ? (item.precio_usd * tasa).toFixed(2) : '...';
        
        return (
            <View style={styles.item}>
                <Text style={styles.nombre}>{item.nombre}</Text>
                <Text style={styles.precio}>
                    ${Number(item.precio_usd)?.toFixed(2)} / Bs {precioBsCalculado}
                </Text>
                <View style={styles.controles}>
                    <TouchableOpacity onPress={() => decrementar(item.id)} style={styles.botonControl}>
                        <Text style={styles.controlTexto}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.cantidad}>{cantidades[item.id] || 0}</Text>
                    <TouchableOpacity onPress={() => incrementar(item.id)} style={styles.botonControl}>
                        <Text style={styles.controlTexto}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const total = calcularTotal();
    const listaFinal = platillosFiltrados(); // La lista que se renderiza

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                <Text style={styles.titulo}>Crear Pedido</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Nombre o referencia del cliente"
                    value={cliente}
                    onChangeText={setCliente}
                />
                
                {/* 🛑 NUEVO: Campo de búsqueda de platillos */}
                <TextInput
                    style={styles.input}
                    placeholder="🔍 Buscar platillos..."
                    value={busqueda}
                    onChangeText={setBusqueda}
                />

                <FlatList
                    style={styles.listaPlatillos}
                    // 🛑 CAMBIO: Usamos la lista filtrada
                    data={listaFinal} 
                    keyExtractor={(item) => item.id} 
                    renderItem={renderItem}
                    ListEmptyComponent={() => (
                        <Text style={{ textAlign: 'center', marginTop: 20, color: '#777' }}>
                            {busqueda.trim() ? `No se encontró "${busqueda}".` : 'No hay platillos disponibles.'}
                        </Text>
                    )}
                />

                <View style={styles.resumen}>
                    <Text style={styles.resumenTitulo}>Resumen del Pedido</Text>
                    <Text style={styles.total}>Total: ${total.usd} / Bs {total.bs}</Text>
                </View>

                <TouchableOpacity style={styles.botonConfirmar} onPress={confirmarPedido}>
                    <Text style={styles.textoBoton}>Confirmar Pedido</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default CrearPedido;