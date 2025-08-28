import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { Link, router, useNavigation, Stack } from 'expo-router';
import { SignDriver, Categoria,ipAddress } from '../Types/SignDriver';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

// URLs da sua API
const API_URL = `${ipAddress}api/SignDriver`;
const API_URL_CTG = `${ipAddress}api/SignDriver/categorias`;

const SignDriverList: React.FC = () => {
  const [signDrivers, setSignDrivers] = useState<SignDriver[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para o campo de pesquisa e filtro
  const [searchText, setSearchText] = useState('');
  const [filteredDrivers, setFilteredDrivers] = useState<SignDriver[]>([]);
  const [showSearchBar, setShowSearchBar] = useState(false);

  // Estado para a categoria selecionada
  const [selectedCategoryId, setSelectedCategoryId] = useState(0);

  // UseEffect único para buscar todos os dados
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [driversResponse, categoriasResponse] = await Promise.all([
          axios.get<SignDriver[]>(API_URL),
          axios.get<Categoria[]>(API_URL_CTG),
        ]);

        const driversData = driversResponse.data;
        const categoriasData = categoriasResponse.data;

        setSignDrivers(driversData);
        setFilteredDrivers(driversData); // Inicialmente, a lista filtrada é a lista completa
        setCategorias(categoriasData);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Erro ao carregar os dados. Verifique a conexão com a API.');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // UseEffect para aplicar o filtro e a pesquisa quando os estados mudam
  useEffect(() => {
    let result = signDrivers;

    // Filtra por categoria
    if (selectedCategoryId !== 0) {
      result = result.filter((item) => item.categoriaId === selectedCategoryId);
    }

    // Filtra por texto de pesquisa
    if (searchText) {
      const lowerCaseSearch = searchText.toLowerCase();
      result = result.filter(
        (item) =>
          item.codigo.toLowerCase().includes(lowerCaseSearch) ||
          item.descricao.toLowerCase().includes(lowerCaseSearch)
      );
    }

    setFilteredDrivers(result);
  }, [searchText, selectedCategoryId, signDrivers]);

  // Função para navegação
  function GetById(Id: number) {
    router.navigate(`Outros/sign?id=${Id.toString()}`);
  }

  // Componente para renderizar cada item da lista principal
  const renderItem = ({ item }: { item: SignDriver }) => (
    <View style={styles.itemContainer} onTouchEnd={() => GetById(item.id)}>
      {item.imageBase64 ? (
        <Image
          source={{ uri: `data:image/jpeg;base64,${item.imageBase64}` }}
          style={styles.image}
          resizeMode="contain"
          onError={() => console.log(`Erro ao carregar imagem do item ${item.id}`)}
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>Sem imagem</Text>
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={styles.codigo}>{item.codigo}</Text>
        <Text style={styles.descricao}>{item.descricao.substring(0, 50)}...</Text>
      </View>
    </View>
  );

  // Lista de categorias, incluindo a opção "Todas"
  const allCategories = [{ id: 0, nome: 'Todas' }, ...categorias];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{headerStyle:{ backgroundColor: '#1f7ce7cc'},headerTitleStyle:{fontWeight:'bold'},headerTitleAlign:'center',headerTintColor:'#ffffff', title: 'Sinalizações'}} />
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{headerStyle:{ backgroundColor: '#1f7ce7cc'},headerTitleStyle:{fontWeight:'bold'},headerTitleAlign:'center',headerTintColor:'#ffffff', title: 'Sinalizações'}} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: '#1f7ce7cc' },
          headerTitleStyle: { fontWeight: 'bold' },
          headerTitleAlign: 'center',
          headerTintColor: '#ffffff',
          title: 'Sinalizações',
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowSearchBar(!showSearchBar)}>
              <Ionicons name="search" size={24} color="#ffffff" style={{ marginRight: 15 }} />
            </TouchableOpacity>
          ),
        }}
      />

      {showSearchBar && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar por código ou descrição..."
            value={searchText}
            onChangeText={setSearchText}
          />
          <FlatList
            data={allCategories}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  selectedCategoryId === item.id && styles.selectedCategoryButton,
                ]}
                onPress={() => setSelectedCategoryId(item.id)}>
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategoryId === item.id && styles.selectedCategoryButtonText,
                  ]}>
                  {item.nome}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          />
        </View>
      )}

      <FlatList
        data={filteredDrivers}
        renderItem={renderItem}
        // Usando o ID e o índice para garantir unicidade, se necessário.
        // O ideal é usar apenas o ID, se ele for único.
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

// ... (Restante dos estilos permanecem os mesmos)
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    list: {
      padding: 10,
    },
    itemContainer: {
      flexDirection: 'row',
      backgroundColor: '#fff',
      padding: 10,
      marginBottom: 10,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    image: {
      width: 80,
      height: 80,
      marginRight: 10,
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
    textContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    codigo: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
    },
    descricao: {
      fontSize: 16,
      color: '#666',
      marginTop: 4,
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
    searchContainer: {
      padding: 10,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    searchInput: {
      height: 40,
      borderColor: '#ccc',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 10,
      marginBottom: 10,
 },
    categoryList: {
      alignItems: 'center',
    },
    categoryButton: {
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 20,
      backgroundColor: '#e0e0e0',
      marginHorizontal: 5,
    },
    selectedCategoryButton: {
      backgroundColor: '#1f7ce7cc',
    },
    categoryButtonText: {
      color: '#333',
      fontWeight: 'bold',
    },
    selectedCategoryButtonText: {
      color: '#fff',
    },
  });
  
  export default SignDriverList;