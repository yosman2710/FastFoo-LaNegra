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
  botonNuevo: {
    marginTop: 20,
    backgroundColor: '#c21c1c',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center'
  }
});