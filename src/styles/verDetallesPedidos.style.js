import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  direccion: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  estado: {
    fontSize: 14,
    color: '#555',
  },
  estadoValor: {
    fontWeight: 'bold',
    color: '#2a2a8f',
  },
  lista: {
    maxHeight: 350,
    marginBottom: 16,
  },
  item: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
  },
  itemNombre: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemControles: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 10,
  },
  control: {
    fontSize: 18,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#eee',
    borderRadius: 4,
  },
  resumen: {
    marginTop: 20,
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pagado: {
    fontSize: 16,
    color: '#2aa86c',
    marginTop: 4,
  },
  pendiente: {
    fontSize: 16,
    color: '#d22',
    marginTop: 4,
  },
  botonFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  botonAbonar: {
    flex: 1,
    backgroundColor: '#6c2aa8',
    padding: 12,
    borderRadius: 8,
  },
  botonAgregar: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
  },
  botonGuardar: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 10,
    marginTop: 24,
  },
  botonTexto: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalFondo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000088',
  },
  modal: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 12,
  },
  modalBotones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelar: {
    color: '#2a2a8f',
    fontWeight: 'bold',
  },
  aceptar: {
    backgroundColor: '#2a2a8f',
    color: '#fff',
    padding: 8,
    borderRadius: 6,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  botonCompletar: {
  backgroundColor: '#04d5ffff',
  padding: 12,
  borderRadius: 8,
  marginTop: 20,
  alignItems: 'center',
},
});