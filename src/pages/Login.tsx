import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { supabase } from "../lib/supabaseClient";
import CryptoJS from 'crypto-js';
import { Eye, EyeOff, AlertTriangle, } from "lucide-react";
import { useUser } from "../context/UserContext";

type UsuarioLogin = {
  id: number;
  papel: { nome: string };
};

// --- Esquema de Validação (sem alterações) ---
const schema = Yup.object().shape({
  email: Yup.string()
    .email("Digite um e-mail válido")
    .required("O campo e-mail é obrigatório"),
  senha: Yup.string().required("O campo senha é obrigatório"),
});

type FormData = Yup.InferType<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const [showSenha, setShowSenha] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const { setUsuario } = useUser();

  const handleLogin = async (data: FormData) => {
    setIsLoading(true);
    setServerError("");

    try {
      const { email, senha } = data;

      const senhaCriptografada = CryptoJS.SHA256(senha).toString(CryptoJS.enc.Hex);

      const { data: userData, error } = await supabase
        .from("usuario")
        .select(`
          id,
          papel!inner(nome)
        `)
        .eq("email", email)
        .eq("senha", senhaCriptografada)
        .maybeSingle() as { data: UsuarioLogin | null; error: { message: string } };

      if (error || !userData) {
        setServerError("Email ou senha inválidos. Por favor, tente novamente." + (error?.message ? ` (${error.message})` : ""));
        setIsLoading(false);
        return;
      }

      const papel = userData.papel.nome;

      if (papel === "responsavel") {
        const { data, error } = await supabase
          .from("responsavel")
          .select("*, endereco(*)")
          .eq("id_usuario", userData.id)
          .maybeSingle();

        if (error || !data) {
          setServerError("Erro ao buscar detalhes do responsável. Contate o administrador.");
          setIsLoading(false);
          return;
        }
        setUsuario({
          papel: papel,
          ...data,
        });
      } else {
        const { data, error } = await supabase
          .from("funcionario")
          .select("*, endereco(*)")
          .eq("id_usuario", userData.id)
          .maybeSingle();

        if (error || !data) {
          setServerError("Erro ao buscar detalhes do colaborador. Contate o administrador.");
          setIsLoading(false);
          return;
        }
        setUsuario({
          papel: papel,
          ...data,
        });
      }

      navigate("/app", { replace: true });
      setIsLoading(false);
    } catch (err) {
      setServerError("Erro interno. Tente novamente.");
      setIsLoading(false);
    }
  };


  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 font-sans">
        {/* Imagem de fundo */}
        <div 
          className="absolute inset-0 -z-20 opacity-30"
          style={{
            backgroundImage: "url('../images/landingPage.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        ></div>
        
      <div className="absolute inset-0 -z-10 bg-odara-offwhite opacity-15"></div>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border-l-2 border-odara-primary">
        <div className="p-9 space-y-6 text-center">
          <div className="space-y-1 pt-8">
            <h1 className="text-3xl font-bold text-odara-accent mb-2">
              Bem-vindo de volta
            </h1>
            <p className="text-sm text-odara-dark">
              Faça login para acessar sua conta
            </p>
          </div>
        </div>
        <div className="px-8 pb-8 space-y-6">
          <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-odara-dark text-left block"
              >
                Email
              </label>
              {/* O input agora é registrado com o react-hook-form */}
              <input
                id="email"
                type="email"
                placeholder="Endereço de email"
                className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label
                htmlFor="senha"
                className="text-sm font-medium text-odara-dark text-left block"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="senha"
                  type={showSenha ? "text" : "senha"}
                  placeholder="Digite a sua senha"
                  className="w-full h-10 px-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
                  {...register("senha")}
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  aria-label={showSenha ? "Esconder senha" : "Mostrar senha"}
                >
                  {showSenha ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.senha && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.senha.message}
                </p>
              )}
            </div>
            {serverError && (
              <div className="flex items-center p-3 space-x-2 bg-red-50 border border-red-200 rounded-md">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="lembrar"
                  name="lembrar"
                  type="checkbox"
                  className="h-4 w-4 text-odara-primary focus:ring-odara-primary border-odara-dark rounded"
                />
                <label htmlFor="lembrar" className="ml-2 block text-sm text-odara-dark hover:text-odara-primary">
                  Lembrar de mim
                </label>
              </div>

              <div className="text-center">
                <a
                  href="#"
                  className="text-sm text-odara-primary hover:text-odara-dark underline-offset-4 hover:underline"
                >
                  Esqueceu a sua senha?
                </a>
              </div>

            </div>


            <button
              type="submit"
              className="w-full h-10 bg-odara-accent hover:bg-odara-secondary disabled:bg-odara-secondary text-white font-medium rounded-md transition-colors flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>A entrar...</span>
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}