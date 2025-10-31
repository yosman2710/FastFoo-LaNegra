import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDEAEF', // fondo rosado suave
    padding: 20
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#000'
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D7263D', // rojo vibrante
    marginBottom: 10
  },
  label: {
    fontSize: 16,
    color: '#000',
    marginBottom: 5
  },
  input: {
    backgroundColor: '#FFF0F5',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    fontStyle: 'italic',
    color: '#000',
    borderWidth: 1,
    borderColor: '#E0AABF'
  },
  imageContainer: {
    backgroundColor: '#444', // gris oscuro
    height: 200,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  imageText: {
    color: '#FFF',
    marginTop: 8
  },
  cameraIcon: {
    width: 40,
    height: 40,
    tintColor: '#FFF'
  },
botonGuardarArribaDerecha: {
  backgroundColor: '#D7263D',
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 20,
  alignSelf: 'flex-end',
  marginBottom: 10
},
textoBotonArribaDerecha: {
  color: '#FFF',
  fontWeight: 'bold',
  fontSize: 14
}

});
