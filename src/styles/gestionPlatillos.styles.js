import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    // ─── Layout ───
    container: {
        flex: 1,
        backgroundColor: '#f7f7f9',
    },
    // ─── Header ───
    header: {
        backgroundColor: '#c21c1c',
        paddingTop: 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        elevation: 8,
        shadowColor: '#c21c1c',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titulo: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.3,
    },
    subtituloHeader: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.75)',
        marginTop: 2,
    },
    // ─── Búsqueda ───
    searchWrapper: {
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        backgroundColor: '#fff',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
    },
    inputBuscar: {
        flex: 1,
        paddingVertical: 13,
        fontSize: 14,
        color: '#222',
    },
    // ─── Lista ───
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 120,
    },
    // ─── Card de Platillo ───
    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 14,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        flexDirection: 'column',
    },
    filaPlatillo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    imagenPlatillo: {
        width: 78,
        height: 78,
        borderRadius: 14,
        marginRight: 14,
        backgroundColor: '#f0f0f0',
    },
    infoPlatillo: {
        flex: 1,
    },
    nombrePlatillo: {
        fontWeight: '800',
        fontSize: 16,
        color: '#111',
        marginBottom: 3,
    },
    precioPlatillo: {
        fontSize: 15,
        color: '#c21c1c',
        fontWeight: '700',
        marginBottom: 3,
    },
    descripcionPlatillo: {
        fontSize: 12,
        color: '#888',
        lineHeight: 17,
    },
    // ─── Divider y botones ───
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginTop: 12,
        marginBottom: 10,
    },
    botonesFila: {
        flexDirection: 'row',
        gap: 10,
    },
    botonAccion: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
    },
    botonEditar: {
        backgroundColor: '#eaf7ec',
        borderWidth: 1.5,
        borderColor: '#4CAF50',
    },
    botonEliminar: {
        backgroundColor: '#fff0f0',
        borderWidth: 1.5,
        borderColor: '#F44336',
    },
    textoBotonEditar: {
        color: '#2e7d32',
        fontWeight: '700',
        fontSize: 13,
    },
    textoBotonEliminar: {
        color: '#f44336',
        fontWeight: '700',
        fontSize: 13,
    },
    textoBoton: {
        fontWeight: '700',
        fontSize: 13,
    },
    // ─── Vacío / Error ───
    mensajeVacio: {
        textAlign: 'center',
        marginTop: 50,
        color: '#bbb',
        fontSize: 15,
        fontWeight: '500',
    },
    error: {
        color: '#f44336',
        textAlign: 'center',
        marginBottom: 10,
        fontWeight: '600',
    },
    // ─── FAB ───
    botonFlotante: {
        position: 'absolute',
        bottom: 28,
        right: 20,
        backgroundColor: '#c21c1c',
        width: 58,
        height: 58,
        borderRadius: 29,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#c21c1c',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    iconoFlotante: {
        color: '#fff',
        fontSize: 34,
        lineHeight: 36,
        fontWeight: '300',
    },
});
