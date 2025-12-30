import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import GestionPedidos from '../screens/gestionPedidos';
import GestionPlatillos from '../screens/gestionPlatillos';
import Configuracion from '../screens/confi';

const Tab = createMaterialTopTabNavigator();

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Pedidos"
      tabBarPosition="bottom"
      screenOptions={({ route }) => {
        let iconName;

        if (route.name === 'Pedidos') {
          iconName = 'fast-food-outline';
        } else if (route.name === 'Platillos') {
          iconName = 'restaurant-outline';
        } else if (route.name === 'Configuración') {
          iconName = 'settings-outline';
        }

        return {
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={iconName} size={24} color={color} />
          ),
          tabBarActiveTintColor: '#6c2aa8',
          tabBarInactiveTintColor: 'gray',
          tabBarIndicatorStyle: {
            backgroundColor: '#6c2aa8',
            height: 3,
            top: 0,
          },
          tabBarStyle: {
            backgroundColor: 'white',
            paddingBottom: insets.bottom,
            height: 60 + insets.bottom,
            borderTopWidth: 1,
            borderTopColor: '#f0f0f0',
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            textTransform: 'none',
            marginTop: -5,
          },
          animationEnabled: true,
          swipeEnabled: true,
        };
      }}
    >
      <Tab.Screen name="Pedidos" component={GestionPedidos} />
      <Tab.Screen name="Platillos" component={GestionPlatillos} />
      <Tab.Screen name="Configuración" component={Configuracion} />
    </Tab.Navigator>
  );
}