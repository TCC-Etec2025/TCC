import { useLocation } from 'react-router-dom';
import CadastroResidente from '../components/forms/residente';

export default function ResidenteCadastroPage() {
  const location = useLocation();
  const residente = location.state?.residente || null;

  return <CadastroResidente residente={residente} />;
}