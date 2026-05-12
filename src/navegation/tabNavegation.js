import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import GestionPedidos from '../screens/gestionPedidos';
import GestionPlatillos from '../screens/gestionPlatillos';

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
        }

        return {
          tabBarIcon: ({ color }) => (
            <Ionicons name={iconName} size={22} color={color} />
          ),
          tabBarActiveTintColor: '#c21c1c',
          tabBarInactiveTintColor: '#aaa',
          tabBarIndicatorStyle: {
            backgroundColor: '#c21c1c',
            height: 3,
            top: 0,
            borderRadius: 2,
          },
          tabBarStyle: {
            backgroundColor: '#fff',
            paddingBottom: insets.bottom,
            height: 62 + insets.bottom,
            borderTopWidth: 1,
            borderTopColor: '#f0f0f0',
            elevation: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            textTransform: 'none',
            marginTop: -4,
            letterSpacing: 0.2,
          },
          animationEnabled: true,
          swipeEnabled: true,
        };
      }}
    >
      <Tab.Screen name="Pedidos" component={GestionPedidos} />
      <Tab.Screen name="Platillos" component={GestionPlatillos} />
    </Tab.Navigator>
  );
}