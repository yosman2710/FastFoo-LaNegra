import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');
const RED = '#c21c1c';

// ── Tarjeta de característica ─────────────────────────────────────
function FeatureCard({ icon, label, delay, animVal }) {
    return (
        <Animated.View
            style={[
                styles.featureCard,
                {
                    opacity: animVal,
                    transform: [{
                        translateY: animVal.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                        }),
                    }],
                },
            ]}
        >
            <View style={styles.featureIconCircle}>
                <Ionicons name={icon} size={30} color={RED} />
            </View>
            <Text style={styles.featureLabel}>{label}</Text>
        </Animated.View>
    );
}

export default function HomeScreen() {
    const navigation = useNavigation();

    // Animaciones de entrada
    const headerAnim  = useRef(new Animated.Value(0)).current;
    const card1Anim   = useRef(new Animated.Value(0)).current;
    const card2Anim   = useRef(new Animated.Value(0)).current;
    const card3Anim   = useRef(new Animated.Value(0)).current;
    const card4Anim   = useRef(new Animated.Value(0)).current;
    const btnAnim     = useRef(new Animated.Value(0)).current;
    const logoScale   = useRef(new Animated.Value(0.85)).current;

    useEffect(() => {
        Animated.stagger(120, [
            Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }),
            Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(card1Anim,  { toValue: 1, duration: 350, useNativeDriver: true }),
            Animated.timing(card2Anim,  { toValue: 1, duration: 350, useNativeDriver: true }),
            Animated.timing(card3Anim,  { toValue: 1, duration: 350, useNativeDriver: true }),
            Animated.timing(card4Anim,  { toValue: 1, duration: 350, useNativeDriver: true }),
            Animated.spring(btnAnim,    { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor={RED} />

            {/* ── Hero ── */}
            <View style={styles.hero}>
                {/* Imagen de fondo con overlay */}
                <Image
                    source={require('../../assets/LaNegra.jpg')}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                />
                <View style={styles.heroOverlay} />

                {/* Logo circular */}
                <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }] }]}>
                    <Image
                        source={require('../../assets/LaNegra.jpg')}
                        style={styles.logoImg}
                        resizeMode="cover"
                    />
                    <View style={styles.logoRing} />
                </Animated.View>

                {/* Título */}
                <Animated.View style={{ opacity: headerAnim, alignItems: 'center' }}>
                    <Text style={styles.heroTitle}>El Sazón de</Text>
                    <Text style={styles.heroTitleAccent}>Mi Negra</Text>
                    <View style={styles.heroBadge}>
                        <Text style={styles.heroBadgeText}>Sistema de Gestión</Text>
                    </View>
                </Animated.View>
            </View>

            {/* ── Contenido principal ── */}
            <View style={styles.body}>
                <Text style={styles.sectionLabel}>Acceso rápido</Text>

                {/* Grid de características */}
                <View style={styles.grid}>
                    <FeatureCard icon="people-outline"       label="Gestión de Clientes"   animVal={card1Anim} />
                    <FeatureCard icon="restaurant-outline"   label="Control del Menú"       animVal={card2Anim} />
                    <FeatureCard icon="cart-outline"         label="Seguimiento de Pedidos" animVal={card3Anim} />
                    <FeatureCard icon="time-outline"         label="Historial Detallado"    animVal={card4Anim} />
                </View>

                <Text style={styles.slogan}>
                    Optimiza tu negocio con nuestra plataforma integral de gestión
                </Text>
            </View>

            {/* ── Botón iniciar ── */}
            <Animated.View
                style={[
                    styles.btnWrap,
                    {
                        opacity: btnAnim,
                        transform: [{
                            scale: btnAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
                        }],
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.btn}
                    activeOpacity={0.88}
                    onPress={() => navigation.navigate('Principal', { screen: 'Pedidos' })}
                >
                    <Ionicons name="play-circle-outline" size={24} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.btnText}>INICIAR GESTIÓN</Text>
                </TouchableOpacity>
            </Animated.View>
        </SafeAreaView>
    );
}

const CARD_W = (width - 48) / 2;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f7f7f9' },

    // ── Hero ──────────────────────────────────────────────
    hero: {
        height: 280,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 24,
        overflow: 'hidden',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(120,0,0,0.55)',
    },
    logoWrap: {
        position: 'absolute',
        top: 30,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoImg: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 3,
        borderColor: '#fff',
    },
    logoRing: {
        position: 'absolute',
        width: 124,
        height: 124,
        borderRadius: 62,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.85)',
        letterSpacing: 1,
    },
    heroTitleAccent: {
        fontSize: 34,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 0.5,
        fontStyle: 'italic',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    heroBadge: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 5,
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    heroBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },

    // ── Body ──────────────────────────────────────────────
    body: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#aaa',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 14,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
    },

    // ── Feature Card ──────────────────────────────────────
    featureCard: {
        width: CARD_W,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 18,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    featureIconCircle: {
        backgroundColor: '#fff5f5',
        width: 62,
        height: 62,
        borderRadius: 31,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: '#ffd5d5',
    },
    featureLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        lineHeight: 18,
    },

    slogan: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 13,
        color: '#aaa',
        lineHeight: 20,
        paddingHorizontal: 8,
    },

    // ── Botón ─────────────────────────────────────────────
    btnWrap: {
        paddingHorizontal: 16,
        paddingBottom: 28,
        paddingTop: 12,
        backgroundColor: '#f7f7f9',
    },
    btn: {
        backgroundColor: RED,
        borderRadius: 18,
        paddingVertical: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: RED,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    btnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16,
        letterSpacing: 1.5,
    },
});