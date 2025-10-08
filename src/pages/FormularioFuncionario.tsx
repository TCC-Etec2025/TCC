import { useLocation } from 'react-router-dom';
import CadastroFuncionario from '../components/forms/funcionario';

export default function FuncionarioCadastroPage() {
  const location = useLocation();
  const funcionario = location.state?.funcionario || null;

  return <CadastroFuncionario funcionario={funcionario} />;
}