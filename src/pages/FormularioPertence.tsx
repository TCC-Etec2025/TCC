import { useLocation } from 'react-router-dom';
import CadastroPertence from '../components/forms/pertence';

export default function PertenceCadastroPage() {
  const location = useLocation();
  const pertence = location.state?.pertence || null;

  return <CadastroPertence pertence={pertence} />;
}