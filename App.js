import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import CrearPlatillo from './src/screens/crearPlatillo';
import EditarPlatillos from './src/screens/editarPlatillos';
import CrearPedido from './src/screens/crearPedidos';
import VerDetallesPedidos from './src/screens/verDetallesPedidos';
import TabNavigator from './src/navegation/tabNavegation';
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Inicio">
        <Stack.Screen name="Inicio" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CrearPlatillo" component={CrearPlatillo} />
        <Stack.Screen name="EditarPlatillo" component={EditarPlatillos} />
        <Stack.Screen name="CrearPedido" component={CrearPedido} />
        <Stack.Screen name="DetallePedido" component={VerDetallesPedidos} />
        <Stack.Screen name="Principal" component={TabNavigator} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}