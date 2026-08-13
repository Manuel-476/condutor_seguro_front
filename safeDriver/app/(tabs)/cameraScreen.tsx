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
  signDistanceMeters: number[]; // Adicionado para distâncias dos sinais de trânsito
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
  const lastAlertMessageRef = useRef<string | null>(null); // Rastreia a última mensagem de alerta para pessoa/animal
  const lastAlertTimestampRef = useRef<number>(0); // Rastreia o timestamp da última reprodução
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

  // Para a fala e limpa estados quando a tela perde o foco
  useEffect(() => {
    if (!isFocused) {
      Speech.stop();
      setCameraReady(false); // Reseta cameraReady para forçar reinicialização ao voltar
      console.log('Tela perdeu o foco, câmera e fala pausadas.');
      
    }
  }, [isFocused]);

  const captureAndSendFrame = async () => {
    if (!isFocused || !cameraRef.current || !cameraReady || isTransitioning) {
      console.log('Captura de frame ignorada. Motivo:', {
        isFocused,
        cameraRef: !!cameraRef.current,
        cameraReady,
        isTransitioning,
      });
      return;
    }

    try {
      console.log('Capturando frame...');
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

      const { personCount, personDistanceMeters, animalCount, animalDistancesMeters, trafficSignCount, signDistanceMeters, holeCount, matchedSigns, unmatchedCrops, imageOutputPath } = response.data;

      setProcessedImageUri(imageOutputPath);

      const personExist = personCount > 0;
      const animalExist = animalCount > 0;
      const trafficSignExist = trafficSignCount > 0;
      const hasCondition = personExist || animalExist;
      let alertMessage = '';

      if (hasCondition) {
        let personMessage = personExist
          ? `${personCount === 1 ? 'Detectada uma' : 'Detectadas ' + personCount} pessoa${personCount === 1 ? '' : 's'} a ${personDistanceMeters.join(' e ')} metros de distância`
          : '';
        let animalMessage = animalExist
          ? (personExist ? ' e ' : '') + `${animalCount} anima${animalCount === 1 ? 'l' : 'is'} a ${animalDistancesMeters.join(' e ')} metros de distância`
          : '';
        alertMessage = personMessage + animalMessage;
      }

      // Lógica de alerta para pessoa/animal: reproduz som se mensagem mudou ou passou 15s
      const now = Date.now();
      let shouldSpeak = false;
      if (hasCondition) {
        shouldSpeak = lastAlertMessageRef.current === null ||
                      lastAlertMessageRef.current !== alertMessage ||
                      (now - lastAlertTimestampRef.current > 15000);
      }

      if (hasCondition && shouldSpeak) {
        Alert.alert('Atenção', alertMessage);
        Speech.speak(alertMessage, { language: 'pt-BR' });
        
        lastAlertMessageRef.current = alertMessage;
        lastAlertTimestampRef.current = now;
      } else if (!hasCondition && lastAlertMessageRef.current !== null) {
        // Reseta a referência quando não há detecção, para forçar alerta na próxima detecção
        lastAlertMessageRef.current = null;
      }

      if (holeCount > 0) {
        const holeMessage = 'Buraco detectado na estrada!';
        Alert.alert('Cuidado', holeMessage);
      //  Speech.speak(holeMessage, { language: 'pt-BR' });
      }

      // Verifica se há sinal de trânsito próximo (menor ou igual a 2 metros)
      const minSignDistance = signDistanceMeters.length > 0 ? Math.min(...signDistanceMeters) : Infinity;
      const trafficSignClose = trafficSignExist && minSignDistance <= 2;

      if (trafficSignClose) {
        let trafficSignMessage = '';
        if (matchedSigns && matchedSigns.length > 0) {
          const sign = matchedSigns[0];
          trafficSignMessage = `Sinal detectado a ${minSignDistance.toFixed(1)} metros: ${sign.code} - ${sign.description}`;
        } else if (unmatchedCrops && unmatchedCrops.length > 0) {
          const unmatched = unmatchedCrops[0];
          trafficSignMessage = `Sinal não reconhecido a ${minSignDistance.toFixed(1)} metros (similaridade ${unmatched.maxSimilarityScore.toFixed(2)} com o sinal ${unmatched.bestMatchCode.toString()}).`;
        } else {
          trafficSignMessage = `Sinal de trânsito detectado a ${minSignDistance.toFixed(1)} metros, mas não identificado.`;
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
      console.log('Intervalo de captura pausado');
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
    setIsTransitioning(true); // Pausa a captura durante a transição
    setCameraReady(false); // Reseta cameraReady para forçar reinicialização
    setPrimaryView(current => (current === 'live' ? 'processed' : 'live'));
    // Aguarda um pequeno atraso para garantir que a câmera esteja pronta
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
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

      {/* Câmera principal só é montada se a tela estiver em foco */}
      {isFocused && (
        <CameraView
          style={primaryView === 'live' ? StyleSheet.absoluteFillObject : styles.pipContainer}
          ref={cameraRef}
          facing={facing}
          flash={flash}
          onCameraReady={() => {
            console.log('Câmera pronta');
            setCameraReady(true);
          }}
          onMountError={(error) => {
            console.error('Erro ao montar a câmera:', error);
            Alert.alert('Erro', 'Falha ao inicializar a câmera.');
          }}
        />
      )}

      {/* Container para a imagem processada */}
      {isFocused && processedImageUri && (
        <TouchableOpacity
          style={primaryView === 'processed' ? styles.fullScreenOverlay : styles.pipContainer}
          onPress={handleToggleView}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: processedImageUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}

      {/* Controles da UI */}
      {isFocused && (
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleFacing}>
            <Ionicons name="camera-reverse" size={30} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={toggleFlash}>
            <Ionicons name={flashModes[flash].icon as any} size={30} color="white" />
            <Text style={styles.buttonText}>{flashModes[flash].text}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Overlay de Texto */}
      {isFocused && (
        <View style={styles.overlay}>
          <Text style={styles.text}>Detecções atuais: {personCount + animalCount + trafficSignCount}</Text>
          <Text style={styles.text}>Câmera ativa (Safe Driver)</Text>
        </View>
      )}
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