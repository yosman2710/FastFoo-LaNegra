import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffe6ea', // 🌸 Fondo pálido
        paddingHorizontal: 16, // Padding horizontal fijo
    },
    // --- Cabecera y Búsqueda ---
    titulo: {
        fontSize: 26,
        fontWeight: 'bold',
        marginTop: 30,
        marginBottom: 10,
        textAlign: 'center',
        color: '#333',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 25, // Mayor redondeo para un look moderno
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },
    // --- Tarjeta de Pedido (Card) ---
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12, // Bordes más suaves
        marginBottom: 14,
        // Sombra suave para elevación sutil
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
        borderWidth: 0, // Eliminamos el borde duro
    },
    // --- Información de la Tarjeta ---
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 15,
        color: '#333',
        marginLeft: 6, // Espacio entre ícono y texto
    },
    nombre: {
        fontSize: 20,
        fontWeight: '700', // Más negrita
        color: '#000',
        marginBottom: 8,
    },
    total: {
        fontSize: 16,
        color: '#333',
    },
    pagado: {
        fontSize: 15,
        color: '#29ba2eff',
    },
    fecha: {
        fontSize: 13,
        color: '#777',
        alignSelf: 'flex-end',
    },
    // --- Estado (Badge) ---
    estadoBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16, // Borde más redondeado (Pill shape)
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        overflow: 'hidden',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        minWidth: 80,
        textAlign: 'center',
        marginTop: 2,
    },
    // --- Acciones y Botones ---
    // En tu archivo gestionPedidos.style.js:

    // 🛑 ELIMINA O COMENTA ESTOS ESTILOS:
    // botonVer: {
    //     backgroundColor: '#2196F3',
    //     paddingVertical: 10,
    //     paddingHorizontal: 20,
    //     borderRadius: 20, 
    //     minWidth: 100,
    //     justifyContent: 'center',
    //     alignItems: 'center',
    // },

    // 🛑 Y ajusta la sección 'acciones' para que el botón Eliminar se alinee correctamente a la derecha:
    acciones: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 15,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    botonVer: {
        backgroundColor: '#2196F3',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20, // Más redondeado
        minWidth: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    botonEliminar: {
        backgroundColor: '#f44336', // Rojo
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20, // Más redondeado
        minWidth: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textoBoton: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
    // --- Botón Flotante (FAB) ---
    botonFlotante: {
        position: 'absolute',
        bottom: 30, // Separado del final
        right: 20,
        backgroundColor: '#c21c1c', // Rojo oscuro
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#c21c1c', // Sombra con color para efecto moderno
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    iconoFlotante: {
        color: '#fff',
        fontSize: 32,
        lineHeight: 32, // Asegura que el "+" se vea bien centrado
        fontWeight: '300',
    },
});