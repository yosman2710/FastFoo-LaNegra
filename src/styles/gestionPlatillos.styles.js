import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffe6ea'
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
    letterSpacing: 0.5,
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
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25, // Mayor redondeo para un look moderno
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
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
  }
});
