import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9'
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
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ccc'
  },
  item: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  nombre: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444'
  },
  precio: {
    fontSize: 16,
    color: '#777',
    marginBottom: 8
  },
  controles: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  botonControl: {
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 6
  },
  controlTexto: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  cantidad: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 12,
    color: '#333'
  },
  listaPlatillos: {
    maxHeight: 350, // 👈 limita la altura de la lista
    marginBottom: 16
  },
  resumen: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc'
  },
  resumenTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333'
  },
  total: {
    fontSize: 16,
    color: '#555'
  },
  botonConfirmar: {
    marginTop: 10,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  textoBoton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
