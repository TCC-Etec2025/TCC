// Removemos 'ALERTAS' pois agora tudo é OCORRENCIA
export type TipoModal = 'MEDICAMENTOS' | 'ATIVIDADES' | 'CARDAPIO' | 'CONSULTAS' | 'OCORRENCIA' | null;

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
  status: string;
  atividade: {
    nome: string;
    horario_inicio: string;
    local: string | null;
    data: string;
  };
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