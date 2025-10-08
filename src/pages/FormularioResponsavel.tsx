import { useLocation } from 'react-router-dom';
import CadastroResponsavel from '../components/forms/responsavel';

export default function ResponsavelCadastroPage() {
  const location = useLocation();
  const responsavel = location.state?.responsavel || null;

  return <CadastroResponsavel responsavel={responsavel} />;
}