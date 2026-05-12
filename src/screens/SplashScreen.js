import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Animated,
    StyleSheet,
    Dimensions,
    StatusBar,
    Image,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
    // Animaciones
    const bgScale    = useRef(new Animated.Value(1.15)).current;
    const logoScale  = useRef(new Animated.Value(0.5)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const titleY     = useRef(new Animated.Value(30)).current;
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const taglineOpacity = useRef(new Animated.Value(0)).current;
    const exitOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Secuencia de animación de entrada
        Animated.sequence([
            // 1. Zoom-out del fondo (Ken Burns)
            Animated.timing(bgScale, {
                toValue: 1,
                duration: 900,
                useNativeDriver: true,
            }),
            // 2. Logo aparece con bounce
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    friction: 5,
                    tension: 60,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),
            // 3. Título sube
            Animated.parallel([
                Animated.spring(titleY, {
                    toValue: 0,
                    friction: 7,
                    tension: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(titleOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),
            // 4. Tagline aparece
            Animated.timing(taglineOpacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            // 5. Pausa antes de salir
            Animated.delay(900),
            // 6. Fade out y navegar
            Animated.timing(exitOpacity, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onFinish?.();
        });
    }, []);

    return (
        <Animated.View style={[styles.container, { opacity: exitOpacity }]}>
            <StatusBar barStyle="light-content" backgroundColor="#c21c1c" />

            {/* Fondo con Ken Burns */}
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: bgScale }] }]}>
                <Image
                    source={require('../../assets/LaNegra.jpg')}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                />
                {/* Overlay degradado */}
                <View style={styles.overlay} />
            </Animated.View>

            {/* Contenido central */}
            <View style={styles.content}>
                {/* Logo con glow */}
                <Animated.View
                    style={[
                        styles.logoWrap,
                        { opacity: logoOpacity, transform: [{ scale: logoScale }] },
                    ]}
                >
                    <Image
                        source={require('../../assets/LaNegra.jpg')}
                        style={styles.logo}
                        resizeMode="cover"
                    />
                    {/* Anillo decorativo */}
                    <View style={styles.logoRing} />
                </Animated.View>

                {/* Título */}
                <Animated.Text
                    style={[
                        styles.titulo,
                        { opacity: titleOpacity, transform: [{ translateY: titleY }] },
                    ]}
                >
                    El Sazón de{'\n'}
                    <Text style={styles.tituloAccent}>Mi Negra</Text>
                </Animated.Text>

                {/* Tagline */}
                <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
                    Sistema de Gestión
                </Animated.Text>
            </View>

            {/* Puntos decorativos abajo */}
            <Animated.View style={[styles.bottomDots, { opacity: taglineOpacity }]}>
                <View style={[styles.dot, styles.dotActive]} />
                <View style={styles.dot} />
                <View style={styles.dot} />
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#c21c1c',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.52)',
    },
    content: {
        alignItems: 'center',
        zIndex: 10,
        paddingHorizontal: 32,
    },
    // Logo circular con ring
    logoWrap: {
        marginBottom: 28,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 4,
        borderColor: '#fff',
    },
    logoRing: {
        position: 'absolute',
        width: 168,
        height: 168,
        borderRadius: 84,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    // Textos
    titulo: {
        fontSize: 34,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        lineHeight: 40,
        marginBottom: 10,
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },
    tituloAccent: {
        color: '#ffce54',
        fontStyle: 'italic',
        fontSize: 38,
    },
    tagline: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '500',
        letterSpacing: 3,
        textTransform: 'uppercase',
        marginTop: 6,
    },
    // Indicador inferior
    bottomDots: {
        position: 'absolute',
        bottom: 52,
        flexDirection: 'row',
        gap: 8,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    dotActive: {
        backgroundColor: '#fff',
        width: 22,
        borderRadius: 3,
    },
});
