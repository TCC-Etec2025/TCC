// =======================================================================
// Tabelas básicas
// =======================================================================

export interface Endereco {
  id: number;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  criado_em: string;
  atualizado_em: string;
}

export interface Papel {
  nome: string;
  descricao?: string;
  criado_em: string;
}

export interface Usuario {
  id: number;
  email: string;
  status: boolean;
  criado_em: string;
  atualizado_em: string;
  nome: string;
  cpf: string;
  papel: string;
}

// =======================================================================
// Entidades principais
// =======================================================================

export interface Funcionario {
  id: number;
  id_usuario: number;
  vinculo: string;
  nome: string;
  cpf: string;
  email: string;
  data_nascimento: string;
  cargo: string;
  registro_profissional?: string;
  data_admissao: string;
  data_demissao?: string;
  telefone_principal: string;
  telefone_secundario?: string;
  id_endereco: number;
  contato_emergencia_nome?: string;
  contato_emergencia_telefone?: string;
  foto?: string;
  status: string;
  criado_em: string;
  atualizado_em: string;
}

export interface Responsavel {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  data_nascimento: string;
  telefone_principal: string;
  telefone_secundario?: string;
  id_endereco: number;
  id_usuario: number;
  status: boolean;
  contato_emergencia_nome?: string;
  contato_emergencia_telefone?: string;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface Residente {
  id: number;
  nome: string;
  data_nascimento: string;
  cpf: string;
  sexo: string;
  estado_civil: string;
  naturalidade?: string;
  data_admissao: string;
  quarto?: string;
  dependencia?: string;
  status: boolean;
  plano_saude?: string;
  numero_carteirinha?: string;
  observacoes?: string;
  foto?: string;
  id_responsavel: number;
  responsavel_parentesco: string;
  criado_em: string;
  atualizado_em: string;
}

// =======================================================================
// Tabelas médicas e operacionais
// =======================================================================

export interface Prontuario {
  id: number;
  id_residente: number;
  tipo_sanguineo?: string;
  alergias?: string;
  comorbidades?: string;
  medicamentos_uso_continuo?: string;
  historico_cirurgico?: string;
  historico_vacinas?: string;
  restricoes_alimentares?: string;
  contato_medico_externo?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface Prescricao {
  id: number;
  id_residente: number;
  medico: string;
  tipo_prescricao: string;
  medicamento: string;
  dosagem: string;
  via_administracao?: string;
  frequencia: string;
  horarios_administracao?: string;
  data_inicio: string;
  data_fim?: string;
  motivo_indicacao?: string;
  observacoes?: string;
  status: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface AdministracaoMedicamento {
  id: number;
  id_prescricao: number;
  id_funcionario: number;
  data_hora_administracao: string;
  status: string;
  observacao?: string;
}

export interface SinaisVitais {
  id: number;
  id_residente: number;
  id_funcionario: number;
  data_hora_medicao: string;
  pressao_arterial?: string;
  temperatura_celsius?: number;
  frequencia_cardiaca_bpm?: number;
  frequencia_respiratoria_rpm?: number;
  saturacao_oxigenio?: number;
  glicemia_mg_dl?: number;
  nivel_dor?: number;
  peso_kg?: number;
  observacao?: string;
}

export interface Ocorrencia {
  id: number;
  id_residente?: number;
  id_funcionario: number;
  data_hora_ocorrencia: string;
  titulo: string;
  descricao_detalhada: string;
  providencias?: string;
  tipo: string;
  status: string;
  visivel: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Visita {
  id: number;
  nome: string;
  cpf: string;
  data_hora_entrada: string;
  data_hora_saida?: string;
  id_funcionario?: number;
  observacoes?: string;
}

export interface AvaliacaoNutricional {
  id: number;
  id_residente: number;
  id_funcionario: number;
  data_avaliacao: string;
  peso_kg: number;
  altura_m?: number;
  imc?: number;
  necessidades_especificas?: string;
  plano_acompanhamento?: string;
}

export interface AtividadeRecreativa {
  id: number;
  nome: string;
  descricao?: string;
  id_funcionario?: number;
  status: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Pertence {
  id: number;
  id_residente: number;
  nome: string;
  descricao?: string;
  estado?: string;
  data_registro: string;
  status: string;
  data_baixa?: string;
  observacoes?: string;
}

// =======================================================================
// Controle de permissões
// =======================================================================

export interface PapelPermissao {
  id: number;
  id_papel: number;
  chave: string;
}
