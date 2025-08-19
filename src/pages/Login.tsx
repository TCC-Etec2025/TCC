import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { supabase } from "../supabaseClient";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // 2. A lógica de simulação foi substituída pela autenticação real
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Email ou senha inválidos. Por favor, tente novamente.");
      setIsLoading(false);
      return;
    }

    // 3. Após o login, buscamos o perfil do utilizador na nossa tabela 'Usuarios'
    //    para descobrir o seu nível de acesso.
    //    IMPORTANTE: A sua tabela 'Usuarios' deve ter uma coluna (ex: 'auth_user_id')
    //    que armazena o ID do utilizador do sistema de autenticação do Supabase.
    if (data.user) {
      const { data: profileData } = await supabase
        .from('Usuarios')
        .select('nivel_acesso')
        .eq('auth_user_id', data.user.id) // Usando a coluna que liga as tabelas
        .single();
      
      const role = profileData?.nivel_acesso;

      // 4. Redirecionamos com base no nível de acesso encontrado
      if (role === 'Admin') {
        navigate('/dashboard/admin');
      } else if (role === 'Responsavel') {
        navigate('/dashboard/responsavel');
      } else if (role === 'Cuidador' || role === 'Enfermagem') {
        navigate('/dashboard/funcionario');
      } else {
        // Se não encontrar um perfil, faz logout por segurança
        setError("Perfil de utilizador não encontrado.");
        supabase.auth.signOut();
      }
    }
    
    setIsLoading(false);
  };

  // O JSX do formulário continua exatamente o mesmo
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="p-8 space-y-6 text-center">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-xl">
              <Building2 className="h-7 w-7 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">Acesso ao Sistema ILPI</h1>
            <p className="text-sm text-gray-600">Digite as suas credenciais para continuar</p>
          </div>
        </div>

        <div className="px-8 pb-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite a sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 px-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center p-3 space-x-2 bg-red-50 border border-red-200 rounded-md">
                <AlertTriangle size={20} className="text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-md transition-colors flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>A entrar...</span>
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <div className="text-center">
            <a href="#" className="text-sm text-indigo-600 hover:text-indigo-800 underline-offset-4 hover:underline">
              Esqueceu a sua senha?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
