import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffe6ea'
  },
  card: {
  padding: 10,
  borderBottomWidth: 1,
  borderBottomColor: '#ccc',
  backgroundColor: '#ffffffff',
  borderRadius: 8,
  marginBottom: 10,
  elevation: 2, // sombra en Android
  shadowColor: '#000', // sombra en iOS
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
},
  inputBuscar: {
    padding: 10,
    backgroundColor: '#ffffffff',
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    borderRadius: 5
  },
     filaPlatillo: {
  flexDirection: 'row',
  alignItems: 'center',
},

imagenPlatillo: {
  width: 80,
  height: 80,
  borderRadius: 8,
  marginRight: 10,
},

infoPlatillo: {
  flex: 1,
},



  itemPlatillo: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc'
  },
  nombrePlatillo: {
    fontWeight: 'bold',
    fontSize: 16
  },
  precioPlatillo: {
    fontSize: 14,
    color: '#555'
  },
botonesFila: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 10,
},

botonAccion: {
  flex: 1,
  paddingVertical: 10,
  borderRadius: 6,
  alignItems: 'center',
  marginHorizontal: 5,
},

botonEditar: {
  backgroundColor: '#4CAF50', // verde
},

botonEliminar: {
  backgroundColor: '#F44336', // rojo
},

textoBoton: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 14,
},

  botonNuevo: {
    marginTop: 20,
    backgroundColor: '#c21c1c',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center'
  }
});
