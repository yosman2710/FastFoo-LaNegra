import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffe6ea' // 🌸 fondo cálido
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333'
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc'
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2
  },
  id: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555'
  },
  nombre: {
    fontSize: 16,
    marginTop: 4,
    color: '#333'
  },
  total: {
    fontSize: 15,
    marginTop: 4,
    color: '#444'
  },
  fecha: {
    fontSize: 14,
    marginTop: 4,
    color: '#000'
  },
  estado: {
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
    fontWeight: 'bold'
    // El color se asignará dinámicamente en el componente
  },
  acciones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  },
  botonVer: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6
  },
  botonEliminar: {
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6
  },
textoBoton: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  botonFlotante: {
  position: 'absolute',
  bottom: 20,
  right: 20,
  backgroundColor: '#c21c1c',
  width: 60,
  height: 60,
  borderRadius: 30,
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 5, // Para Android
  shadowColor: '#000', // Para iOS
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 3,
},

iconoFlotante: {
  color: '#fff',
  fontSize: 30,
  fontWeight: 'bold',
},
estadoBadge: {
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 12,
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 12,
  overflow: 'hidden',
  textTransform: 'uppercase'
},
pagado: {
  fontSize: 15,
  marginTop: 4,
  color: '#666'
}
});