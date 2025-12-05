// Removemos 'ALERTAS' pois agora tudo é OCORRENCIA
export type TipoModal = 'MEDICAMENTOS' | 'ATIVIDADES' | 'CARDAPIO' | 'CONSULTAS' | 'OCORRENCIA' | 'EXAMES' | null;

export interface BaseContentProps {
  idResidente: number;
}

// Interfaces de Dados (Mantidas iguais)
export interface Medicamento {
  id: number;
  nome: string;
  dosagem: string;
  intervalo: number;
  recorrencia: string;
  horario_inicio: string;
  status: string;
}

export interface Atividade {
  id: number;
  nome: string;
  categoria: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  local: string;
  observacao: string;
  status: string;
}

export interface Cardapio {
  id: number;
  refeicao: string;
  alimento: string;
  horario: string;
  observacao: string | null;
  data: string;
}

export interface Consulta {
  id: number;
  medico: string;
  data_consulta: string;
  horario: string;
  motivo_consulta: string | null;
}

export interface Ocorrencia {
  id: number;
  tipo_ocorrencia: string; 
  titulo: string;
  descricao: string;
  data_ocorrencia: string;
  data: string;
  horario: string;
  providencias: string | null;
}

export interface Exame {
  id: number;
  id_consulta: number;
  tipo: string;
  data: string;
  horario: string;
  laboratorio: string | null;
  resultado: string;
  arquivo_resultado: string;
}