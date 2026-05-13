import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    StyleSheet,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    useRef,
    StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { obtenerTasaDolar, actualizarTasaDolar } from '../services/configService.js';
import { useRef as useReactRef } from 'react';

export default function UserMenu() {
    const [menuVisible, setMenuVisible]   = useState(false);
    const [configVisible, setConfigVisible] = useState(false);
    const [tasa, setTasa]     = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fadeAnim  = useReactRef(new Animated.Value(0)).current;
    const slideAnim = useReactRef(new Animated.Value(-8)).current;

    const openMenu = () => {
        setMenuVisible(true);
        Animated.parallel([
            Animated.timing(fadeAnim,  { toValue: 1, duration: 160, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
        ]).start();
    };

    const closeMenu = () => {
        Animated.parallel([
            Animated.timing(fadeAnim,  { toValue: 0, duration: 120, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: -8, duration: 120, useNativeDriver: true }),
        ]).start(() => setMenuVisible(false));
    };

    const handleAbrirConfig = async () => {
        closeMenu();
        try { setTasa(await obtenerTasaDolar()); } catch { setTasa(''); }
        setTimeout(() => setConfigVisible(true), 200);
    };

    const handleGuardarTasa = async () => {
        const valor = parseFloat(tasa);
        if (isNaN(valor) || valor <= 0) {
            Alert.alert('⚠️ Valor inválido', 'Ingresa un número mayor a 0');
            return;
        }
        setIsSaving(true);
        try {
            await actualizarTasaDolar(valor.toFixed(2).toString());
            Alert.alert('✅ Tasa actualizada', `1 USD = ${valor.toFixed(2)} Bs`);
            setConfigVisible(false);
        } catch {
            Alert.alert('Error', 'No se pudo guardar la tasa en la nube.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            {/* ── Botón hamburguesa (inline en el header) ── */}
            <TouchableOpacity style={styles.menuBtn} onPress={openMenu} activeOpacity={0.8}>
                <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>

            {/* ── Dropdown ── */}
            {menuVisible && (
                <Modal transparent animationType="none" onRequestClose={closeMenu}>
                    <Pressable style={styles.overlay} onPress={closeMenu}>
                        <Animated.View
                            style={[
                                styles.dropdown,
                                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                            ]}
                        >
                            <TouchableOpacity style={styles.menuItem} onPress={handleAbrirConfig}>
                                <Ionicons name="settings-outline" size={20} color="#c21c1c" />
                                <Text style={styles.menuItemText}>Configuración</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </Pressable>
                </Modal>
            )}

            {/* ── Modal Configuración ── */}
            <Modal
                visible={configVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setConfigVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalIconCircle}>
                                <Ionicons name="cash-outline" size={26} color="#fff" />
                            </View>
                            <TouchableOpacity onPress={() => setConfigVisible(false)}>
                                <Ionicons name="close" size={22} color="#999" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalTitle}>Tasa del Dólar</Text>
                        <Text style={styles.modalSubtitle}>Actualiza el valor de 1 USD en Bolívares</Text>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputPrefix}>Bs</Text>
                            <TextInput
                                style={styles.modalInput}
                                keyboardType="numeric"
                                value={tasa}
                                onChangeText={setTasa}
                                placeholder="Ej: 45.00"
                                placeholderTextColor="#bbb"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
                            onPress={handleGuardarTasa}
                            disabled={isSaving}
                        >
                            <Text style={styles.saveBtnText}>{isSaving ? 'Guardando…' : 'Guardar Tasa'}</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    // ─── Botón hamburguesa (inline, sin position absolute) ───
    menuBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    // ─── Overlay y dropdown ───
    overlay: {
        flex: 1,
        alignItems: 'flex-end',
        paddingTop: (StatusBar.currentHeight ?? 24) + 60,
        paddingRight: 16,
    },
    dropdown: {
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingVertical: 6,
        minWidth: 210,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 14,
        gap: 12,
    },
    menuItemText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#222',
    },
    // ─── Modal configuración ───
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 28,
        width: '100%',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalIconCircle: {
        backgroundColor: '#c21c1c',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#888',
        marginBottom: 22,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 14,
        paddingHorizontal: 16,
        marginBottom: 20,
        borderWidth: 1.5,
        borderColor: '#eee',
    },
    inputPrefix: {
        fontSize: 16,
        fontWeight: '700',
        color: '#c21c1c',
        marginRight: 8,
    },
    modalInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 20,
        fontWeight: '600',
        color: '#111',
    },
    saveBtn: {
        backgroundColor: '#c21c1c',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});
