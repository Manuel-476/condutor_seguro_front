import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Camera, CameraCapturedPicture, CameraView } from 'expo-camera';
import { Stack } from 'expo-router';
import axios from 'axios';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { ipAddress } from '../Types/SignDriver';

interface MatchedSign {
  code: string;
  description: string;
  similarityScore: number;
}

interface UnmatchedCrop {
  cropPath: string;
  maxSimilarityScore: number;
  bestMatchCode: string;
}

interface ApiResponse {
  personCount: number;
  personDistanceMeters: number[];
  trafficSignCount: number;
  animalCount: number;
  animalDistancesMeters: number[];
  holeCount: number;
  holeDetected?: boolean;
  imageOutputPath: string;
  matchedSigns: MatchedSign[];
  unmatchedCrops: UnmatchedCrop[];
}

const { width } = Dimensions.get('window');

const CameraScreen: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState<'on' | 'off' | 'auto'>('off');
  const [personCount, setPersonCount] = useState(0);
  const [animalCount, setAnimalCount] = useState(0);
  const [trafficSignCount, setTrafficSignCount] = useState(0);
  const [matchedSigns, setMatchedSigns] = useState<MatchedSign[]>([]);
  const [unmatchedCrops, setUnmatchedCrops] = useState<UnmatchedCrop[]>([]);
  const [processedImageUri, setProcessedImageUri] = useState<string | null>(null);
  const [primaryView, setPrimaryView] = useState<'live' | 'processed'>('live');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const cameraRef = useRef<any>(null);
  const isFocused = useIsFocused();

  const flashModes = {
    on: { icon: 'flash', text: 'ON' },
    off: { icon: 'flash-off', text: 'OFF' },
    auto: { icon: 'flash-auto', text: 'AUTO' },
  };

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const captureAndSendFrame = async () => {
    if (!cameraRef.current || !cameraReady || isTransitioning) {
      return;
    }

    try {
      const photo: CameraCapturedPicture = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: false,
        skipProcessing: true,
      });

      const formData = new FormData();
      formData.append('file', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'frame.jpg',
      } as any);

      const response = await axios.post<ApiResponse>(`${ipAddress}api/passenger/verify`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { personCount, personDistanceMeters, animalCount, animalDistancesMeters, trafficSignCount, holeCount, matchedSigns, unmatchedCrops, imageOutputPath } = response.data;

      setProcessedImageUri(imageOutputPath);

      const personExist = personCount > 0;
      const animalExist = animalCount > 0;
      const trafficSignExist = trafficSignCount > 0;
      let personMessage = personExist
        ? `${personCount === 1 ? 'Detectada uma' : 'Detectadas ' + personCount} pessoa${personCount === 1 ? '' : 's'} a ${personDistanceMeters.join(' e ')} metros de distância`
        : '';
      let animalMessage = animalExist
        ? (personExist ? ' e ' : '') + `${animalCount} anima${animalCount === 1 ? 'l' : 'is'} a ${animalDistancesMeters.join(' e ')} metros de distância`
        : '';
      let alertMessage = personMessage + animalMessage;

      if (personExist || animalExist) {
        Speech.speak(alertMessage, { language: 'pt-BR' });
        Alert.alert('Atenção', alertMessage);
      }

      if (holeCount > 0) {
        const holeMessage = 'Buraco detectado na estrada!';
        Alert.alert('Cuidado', holeMessage);
        Speech.speak(holeMessage, { language: 'pt-BR' });
      }

      if (trafficSignExist) {
        let trafficSignMessage = '';
        if (matchedSigns && matchedSigns.length > 0) {
          const sign = matchedSigns[0];
          trafficSignMessage = `Sinal detectado: ${sign.code} - ${sign.description}`;
        } else if (unmatchedCrops && unmatchedCrops.length > 0) {
          const unmatched = unmatchedCrops[0];
          trafficSignMessage = `Sinal não reconhecido (similaridade ${unmatched.maxSimilarityScore.toFixed(2)}).`;
        } else {
          trafficSignMessage = 'Sinal de trânsito detectado, mas não identificado.';
        }
        Alert.alert('Informação', trafficSignMessage);
        Speech.speak(trafficSignMessage, { language: 'pt-BR' });
      }

      setPersonCount(personCount);
      setAnimalCount(animalCount);
      setTrafficSignCount(trafficSignCount);
      setMatchedSigns(matchedSigns);
      setUnmatchedCrops(unmatchedCrops);

    } catch (error) {
      console.error('Erro ao enviar frame:', error);
      Alert.alert('Erro', 'Falha ao processar o frame. Tente novamente: ' + error);
    }
  };

  useEffect(() => {
    if (!hasPermission || !cameraReady || !isFocused || isTransitioning) {
      return;
    }

    const interval = setInterval(() => {
      captureAndSendFrame();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [hasPermission, cameraReady, facing, flash, isFocused, isTransitioning]);

  const toggleFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  const handleToggleView = () => {
    setPrimaryView(current => (current === 'live' ? 'processed' : 'live'));
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text>Solicitando permissão...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text>Permissão de câmera negada</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Câmera principal sempre ativa e no fundo. Ocupa a tela inteira. */}
      {isFocused && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          ref={cameraRef}
          facing={facing}
          flash={flash}
          onCameraReady={() => setCameraReady(true)}
        />
      )}

      {/* Container que irá conter a visualização principal */}
      <View style={styles.fullScreenOverlay}>
        {primaryView === 'live' ? (
          // Tela principal: imagem da câmera sem boxes (apenas o fundo)
          <View style={StyleSheet.absoluteFill} />
        ) : (
          // Tela principal: imagem com boxes (sobreposta ao fundo da câmera)
          processedImageUri && (
            <Image
              source={{ uri: processedImageUri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          )
        )}
      </View>

      {/* Container da tela PiP */}
      <TouchableOpacity
        style={styles.pipContainer}
        onPress={handleToggleView}
        activeOpacity={0.7}
      >
        {/* Lógica para exibir a visualização oposta na PiP */}
        {primaryView === 'processed' ? (
          // PiP: mostra a câmera limpa
          <View style={StyleSheet.absoluteFill} />
        ) : (
          // PiP: mostra a imagem com boxes
          processedImageUri && (
            <Image
              source={{ uri: processedImageUri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          )
        )}
      </TouchableOpacity>

      {/* Controles da UI */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.button} onPress={toggleFacing}>
          <Ionicons name="camera-reverse" size={30} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={toggleFlash}>
          <Ionicons name={flashModes[flash].icon as any} size={30} color="white" />
          <Text style={styles.buttonText}>{flashModes[flash].text}</Text>
        </TouchableOpacity>
      </View>

      {/* Overlay de Texto */}
      <View style={styles.overlay}>
        <Text style={styles.text}>Detecções atuais: {personCount + animalCount + trafficSignCount}</Text>
        <Text style={styles.text}>Câmera ativa (Safe Driver)</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  pipContainer: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    width: width * 0.3,
    height: (width * 0.3) * (16 / 9),
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 2,
  },
  controlsContainer: {
    position: 'absolute',
    top: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    zIndex: 3,
    alignSelf: 'center',
  },
  button: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 50,
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
    zIndex: 3,
    alignSelf: 'center',
  },
  text: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default CameraScreen;