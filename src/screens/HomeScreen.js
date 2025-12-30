import React from 'react';
import { View, Text, ImageBackground, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/LaNegra.jpg')}
        style={styles.header}
        resizeMode="cover"
      >
      </ImageBackground>


      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          <IconBox icon="users" label="Gestión de Clientes" />
          <IconBox icon="bars" label="Control del Menú" />
          <IconBox icon="shopping-cart" label="Seguimiento de Pedidos" />
          <IconBox icon="clock" label="Historial Detallado" />
        </View>
        <Text style={styles.subText}>
          Optimiza tu negocio con mi plataforma personalizada integral de gestión
        </Text>
      </ScrollView>



      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Principal', { screen: 'Platillos' })}
      >
        <Text style={styles.buttonText}>I→ INICIAR</Text>
      </TouchableOpacity>
    </View>
  );
}

function IconBox({ icon, label }) {
  return (
    <View style={styles.iconBox}>
      <FontAwesome5 name={icon} size={60} color="#c21c1c" />
      <Text style={styles.iconLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffe6ea' },
  header: { height: 240, justifyContent: 'flex-end' },
  subText: { fontSize: 14, color: '#c21c1cff', marginBottom: 4, textAlign: 'center', fontWeight: 'bold' },

  content: {
    paddingHorizontal: 20,
    paddingTop: 120,
    paddingBottom: 100,
    // espacio para el botón
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  iconBox: {
    width: '45%',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 40,
    elevation: 2,
  },
  iconLabel: { marginTop: 6, fontSize: 15, textAlign: 'center' },

  button: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: '#c21c1c',
    paddingVertical: 20,
    borderRadius: 50,
  },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
});