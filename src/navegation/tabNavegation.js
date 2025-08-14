import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import GestionPedidos from '../screens/gestionPedidos';
import GestionPlatillos from '../screens/gestionPlatillos';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Pedidos"
      screenOptions={({ route }) => {
        let iconName;

        if (route.name === 'Pedidos') {
          iconName = 'fast-food-outline';
        } else if (route.name === 'Platillos') {
          iconName = 'restaurant-outline';
        }

        return {
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={iconName} size={size} color={color} />
          ),
          tabBarActiveTintColor: '#6c2aa8',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        };
      }}
    >
      <Tab.Screen name="Pedidos" component={GestionPedidos} />
      <Tab.Screen name="Platillos" component={GestionPlatillos} />
    </Tab.Navigator>
  );
}