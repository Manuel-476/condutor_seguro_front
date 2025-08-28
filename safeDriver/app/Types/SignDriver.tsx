export interface SignDriver {
  id: number;
  codigo: string;
  descricao: string;
  imageBase64: string | null;
  categoriaId: number;
}

export interface Categoria {
  id: number;
  nome: string;
}

export const ipAddress = "http://192.168.0.102:7205/";