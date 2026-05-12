import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen       from './src/screens/SplashScreen';
import HomeScreen         from './src/screens/HomeScreen';
import CrearPlatillo      from './src/screens/crearPlatillo';
import EditarPlatillos    from './src/screens/editarPlatillos';
import DetallePlatillo    from './src/screens/detallePlatillo';
import CrearPedido        from './src/screens/crearPedidos';
import VerDetallesPedidos from './src/screens/verDetallesPedidos';
import TabNavigator       from './src/navegation/tabNavegation';

const Stack = createNativeStackNavigator();

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  // Muestra el splash animado antes de montar el navigator
  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Inicio">
        <Stack.Screen name="Inicio"          component={HomeScreen}         options={{ headerShown: false }} />
        <Stack.Screen name="CrearPlatillo"   component={CrearPlatillo}      options={{ headerShown: false }} />
        <Stack.Screen name="EditarPlatillo"  component={EditarPlatillos}    options={{ headerShown: false }} />
        <Stack.Screen name="CrearPedido"     component={CrearPedido}        options={{ headerShown: false }} />
        <Stack.Screen name="DetallePedido"   component={VerDetallesPedidos} options={{ headerShown: false }} />
        <Stack.Screen name="DetallePlatillo" component={DetallePlatillo}    options={{ headerShown: false }} />
        <Stack.Screen name="Principal"       component={TabNavigator}       options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}