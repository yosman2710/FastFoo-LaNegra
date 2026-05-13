import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

/**
 * Hook que activa el modo inmersión completo:
 * - StatusBar translúcida (contenido debajo del status bar)
 * - Navigation bar del sistema oculta (modo inmersión)
 */
export function useImmersiveMode() {
    useEffect(() => {
        // Oculta la barra de navegación del sistema (botones de Android)
        NavigationBar.setVisibilityAsync('hidden');
        // Comportamiento: al swipe reaparece momentáneamente y vuelve a ocultarse
        NavigationBar.setBehaviorAsync('overlay-swipe');

        return () => {
            // Restaurar al desmontar si es necesario
            // NavigationBar.setVisibilityAsync('visible');
        };
    }, []);
}
