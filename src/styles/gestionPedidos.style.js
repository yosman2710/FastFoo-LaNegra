import { StyleSheet, StatusBar } from 'react-native';

const STATUS_BAR_H = StatusBar.currentHeight ?? 24;

export const styles = StyleSheet.create({
    // ─── Layout ───
    container: {
        flex: 1,
        backgroundColor: '#f7f7f9',
    },
    // ─── Header ───
    header: {
        backgroundColor: '#c21c1c',
        paddingTop: (STATUS_BAR_H ?? 24) + 14,
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
    // ─── Barra de búsqueda ───
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
    searchIcon: {
        marginRight: 8,
        fontSize: 16,
    },
    input: {
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
    // ─── Tarjeta de Pedido ───
    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    nombre: {
        fontSize: 17,
        fontWeight: '800',
        color: '#111',
        flex: 1,
        marginRight: 8,
    },
    estadoBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        color: '#fff',
        fontWeight: '700',
        fontSize: 11,
        overflow: 'hidden',
        letterSpacing: 0.6,
    },
    // ─── Info financiera ───
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    total: {
        fontSize: 15,
        color: '#333',
        fontWeight: '600',
    },
    fecha: {
        fontSize: 12,
        color: '#aaa',
        fontWeight: '500',
    },
    pagado: {
        fontSize: 14,
        color: '#1e8c3a',
        fontWeight: '600',
    },
    deudaPendiente: {
        fontSize: 13,
        color: '#c21c1c',
        fontWeight: '700',
        marginTop: 2,
    },
    // ─── Divider y acciones ───
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginTop: 12,
        marginBottom: 10,
    },
    acciones: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    botonEliminar: {
        backgroundColor: '#fff0f0',
        paddingVertical: 8,
        paddingHorizontal: 18,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#f44336',
    },
    textoBoton: {
        color: '#f44336',
        fontWeight: '700',
        fontSize: 13,
    },
    // ─── Vacío ───
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 15,
        color: '#bbb',
        marginTop: 12,
        fontWeight: '500',
    },
    // ─── FAB (+) ───
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
    // ─── Loading ───
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f7f7f9',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#888',
    },
});