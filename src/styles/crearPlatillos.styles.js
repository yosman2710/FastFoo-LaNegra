import { StyleSheet } from 'react-native';

const RED = '#c21c1c';
const BG  = '#f7f7f9';

export const styles = StyleSheet.create({
    // ── Contenedor principal ──────────────────────────────
    safeArea: {
        flex: 1,
        backgroundColor: BG,
    },
    scrollContent: {
        paddingBottom: 40,
    },

    // ── Header rojo ──────────────────────────────────────
    headerBlock: {
        backgroundColor: RED,
        paddingTop: 20,
        paddingBottom: 28,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        marginBottom: 20,
        elevation: 8,
        shadowColor: RED,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
    },
    backBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    headerTexts: {
        flex: 1,
    },
    headerTitulo: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitulo: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.75)',
    },
    saveBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },

    // ── Tarjeta de precios ────────────────────────────────
    preciosCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    precioChip: {
        alignItems: 'center',
        flex: 1,
    },
    precioChipLabel: {
        fontSize: 11,
        color: '#aaa',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    precioChipValor: {
        fontSize: 18,
        fontWeight: '800',
        color: RED,
    },
    precioChipDivider: {
        width: 1,
        backgroundColor: '#f0f0f0',
        marginHorizontal: 10,
    },

    // ── Sección label ─────────────────────────────────────
    seccionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#aaa',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginHorizontal: 16,
        marginBottom: 8,
        marginTop: 4,
    },

    // ── Campos de formulario ──────────────────────────────
    fieldCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        marginHorizontal: 16,
        marginBottom: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#aaa',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        paddingHorizontal: 16,
        paddingTop: 12,
        marginBottom: 2,
    },
    fieldInput: {
        paddingHorizontal: 16,
        paddingBottom: 14,
        paddingTop: 6,
        fontSize: 16,
        color: '#111',
        fontWeight: '500',
    },
    fieldInputMultiline: {
        paddingHorizontal: 16,
        paddingBottom: 14,
        paddingTop: 6,
        fontSize: 15,
        color: '#111',
        height: 90,
        textAlignVertical: 'top',
    },
    picker: {
        marginHorizontal: 8,
        color: '#111',
    },

    // ── Imagen ────────────────────────────────────────────
    imageWrapper: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 18,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        height: 200,
    },
    imageFullCover: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.35)',
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    imageOverlayText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
});
