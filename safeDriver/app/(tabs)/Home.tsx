import React from 'react';
import {Link,router,useNavigation,Stack} from "expo-router";
import { StyleSheet, View, Text, ScrollView, Image, SafeAreaView } from 'react-native';

const HomeScreen = () => {
 
  return (
    <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{headerStyle:{ backgroundColor: '#1f7ce7cc'},headerTitleStyle:{fontWeight:'bold'},headerTitleAlign:'center',headerTintColor:'#ffffff'}} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          {/* Você pode substituir esta imagem pelo logo do seu app */}
          <Image
            source={require('.././assets/safe.png')}
            style={styles.logo}
            
          />
          <Text style={styles.title}>Bem-vindo ao SafeDriver!</Text>
          <Text style={styles.subtitle}>Seu copiloto inteligente para uma viagem segura.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nossa missão é a sua segurança.</Text>
          <Text style={styles.cardText}>
            O SafeDriver foi criado para ser seu melhor amigo na estrada, ajudando você a dirigir com mais tranquilidade e atenção.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Funcionalidades principais:</Text>
          
          <View style={styles.featureItem}>
            <Image
              source={require('.././assets/alert_road.png')}
              style={styles.featureIcon}
            />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Alerta de Pedestres</Text>
              <Text style={styles.featureDescription}>
                Receba alertas em tempo real sobre a presença de pedestres em áreas perigosas, garantindo a segurança de todos.
              </Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Image
              source={require('.././assets/road-sign.png')}
              style={styles.featureIcon}
            />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Descrição de Sinais Rodoviários</Text>
              <Text style={styles.featureDescription}>
                Nunca mais tenha dúvidas! O app oferece uma descrição detalhada dos sinais de trânsito, ajudando você a interpretá-los corretamente.
              </Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Image
              source={require('.././assets/hole.png')}
              style={styles.featureIcon}
            />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Alerta de Buracos</Text>
              <Text style={styles.featureDescription}>
                Evite danos ao seu veículo. Seja alertado sobre buracos na estrada com antecedência.
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.footerText}>
          Boa viagem e dirija com segurança!
        </Text>
        <Text style={styles.footerText}>
          Smart Entity
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f4f7', // Cor de fundo suave
  },
  container: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    borderRadius:12
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 50
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#003366', // Azul escuro
    textAlign:'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginTop: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 15,
  },
  cardText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureIcon: {
    width: 40,
    height: 40,
    marginRight: 15,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003366',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
  footerText: {
    marginTop: 20,
    fontSize: 14,
    color: '#888',
  },
});

export default HomeScreen;