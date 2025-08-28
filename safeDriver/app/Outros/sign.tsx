import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, SafeAreaView, ScrollView, Button } from 'react-native';
import { Stack, useLocalSearchParams } from "expo-router";
import axios from 'axios';
import { SignDriver, ipAddress } from '../Types/SignDriver';
import * as Speech from 'expo-speech';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TrafficSignResult: React.FC = () => {
    const { id } = useLocalSearchParams();
    const API_URL = `${ipAddress}api/SignDriver/${id}`;

    // Hook para obter as margens de área segura do dispositivo
    const insets = useSafeAreaInsets();

    const [signDrivers, setSignDrivers] = useState<SignDriver>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Função para buscar os dados da API
    useEffect(() => {
        const fetchSignDrivers = async () => {
            try {
                const response = await axios.get(API_URL);
                setSignDrivers(response.data);
                setLoading(false);
            } catch (err) {
                setError('Erro ao carregar os dados');
                setLoading(false);
            }
        };

        fetchSignDrivers();
    }, [API_URL]);

    // Função para a leitura por voz
    const speakContent = () => {
        if (signDrivers) {
            const textToSpeak = `Código: ${signDrivers.codigo}. Descrição: ${signDrivers.descricao}`;
            Speech.speak(textToSpeak, {
                language: 'pt-BR',
                pitch: 1.2,
                rate: 1.0,
            });
        }
    };

    // Função para parar a leitura por voz
    const stopSpeaking = () => {
        Speech.stop();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Stack.Screen options={{ headerStyle: { backgroundColor: '#1f7ce7cc' }, headerTitleStyle: { fontWeight: 'bold' }, headerTitleAlign: 'center', headerTintColor: '#ffffff' }} />
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Stack.Screen options={{ headerStyle: { backgroundColor: '#1f7ce7cc' }, headerTitleStyle: { fontWeight: 'bold' }, headerTitleAlign: 'center', headerTintColor: '#ffffff', headerTitle: 'Sinalização Rodoviária' }} />
                <Text style={styles.errorText}>{error} {id}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ headerStyle: { backgroundColor: '#1f7ce7cc' }, headerTitleStyle: { fontWeight: 'bold' }, headerTitleAlign: 'center', headerTintColor: '#ffffff' }} />
            
            <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 80 + insets.bottom }]}>
                <View style={styles.header}>
                    {signDrivers?.imageBase64 ? (
                        <Image
                            source={{ uri: `data:image/jpeg;base64,${signDrivers?.imageBase64}` }}
                            style={styles.logo}
                            resizeMode="contain"
                            onError={() => console.log(`Erro ao carregar imagem do item ${signDrivers?.id}`)}
                        />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Text style={styles.placeholderText}>Sem imagem</Text>
                        </View>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{signDrivers?.codigo}</Text>
                    <Text style={styles.cardText}>
                        {signDrivers?.descricao}
                    </Text>
                </View>
            </ScrollView>

            <View style={[styles.floatingButtonContainer, { bottom: insets.bottom + 20 }]}>
                <View style={styles.buttonWrapper}>
                    <Button
                        title="Ouvir Sinal"
                        onPress={speakContent}
                        color="#1f7ce7"
                    />
                </View>
                <View style={styles.buttonWrapper}>
                    <Button
                        title="Parar Leitura"
                        onPress={stopSpeaking}
                        color="#d9534f" // Cor de um botão de 'stop' (vermelho)
                    />
                </View>
            </View>
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
        borderRadius: 12
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 10,
        borderRadius: 50
    },
    placeholderImage: {
        width: 80,
        height: 80,
        marginRight: 10,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
    },
    placeholderText: {
        color: '#666',
        fontSize: 14,
    },
    image: {
        width: 80,
        height: 80,
        marginRight: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#003366', // Azul escuro
        textAlign: 'center'
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
    },
    floatingButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        position: 'absolute', // Permite que os botões flutuem
        left: 20,
        right: 20,
        backgroundColor: 'transparent',
    },
    buttonWrapper: {
        flex: 1,
        marginHorizontal: 5,
    },
});

export default TrafficSignResult;