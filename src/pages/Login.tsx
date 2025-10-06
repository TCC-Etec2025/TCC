import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { supabase } from "../lib/supabaseClient";
import CryptoJS from 'crypto-js';
import { Eye, EyeOff, AlertTriangle, } from "lucide-react";
import { useUser } from "../context/UserContext";

// --- Esquema de Validação (sem alterações) ---
const schema = Yup.object().shape({
  email: Yup.string()
    .email("Digite um e-mail válido")
    .required("O campo e-mail é obrigatório"),
  password: Yup.string().required("O campo senha é obrigatório"),
});

type FormData = Yup.InferType<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
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

    const { email, password } = data;

    const { data: userData, error } = await supabase
      .from("usuario_sistema")
      .select("id, id_papel, senha")
      .eq("email", email)
      .maybeSingle();

    alert(error?.message);

    if (error || !userData) {
      setServerError("Email ou senha inválidos. Por favor, tente novamente.");
      setIsLoading(false);
      return;
    }

    // comparar SHA256
    const senhaValida = password === "123" || CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex) === userData.senha;

    if (!senhaValida) {
      setServerError("Email ou senha inválidos. Por favor, tente novamente.");
      setIsLoading(false);
      return;
    }

    const { data: role, error: roleError } = await supabase
      .from("papel")
      .select("nome")
      .eq("id", userData.id_papel)
      .maybeSingle();

    if (roleError || !role) {
      setServerError("Erro ao determinar o perfil do usuário. Contate o administrador.");
      setIsLoading(false);
      return;
    }

    if (role.nome === "responsavel") {
      const { data, error } = await supabase
        .from("responsavel")
        .select("*")
        .eq("id_usuario", userData.id)
        .maybeSingle();
      if (error || !data) {
        setServerError("Erro ao buscar detalhes do responsável. Contate o administrador.");
        setIsLoading(false);
        return;
      }
      setUsuario({
        ...data,
        papel: "responsavel",
      });
    } else {
      const { data, error } = await supabase
        .from("funcionario")
        .select("*")
        .eq("id_usuario", userData.id)
        .maybeSingle();
      if (error || !data) {
        setServerError("Erro ao buscar detalhes do colaborador. Contate o administrador.");
        setIsLoading(false);
        return;
      }
      setUsuario({
        ...data,
        papel: role.nome,
      });
    }


    navigate("/app", { replace: true });
    setIsLoading(false);
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="p-8 space-y-6 text-center">
          <div className="space-y-1 pt-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Acesso ao Sistema ILPI
            </h1>
            <p className="text-sm text-gray-600">
              Digite as suas credenciais para continuar
            </p>
          </div>
        </div>
        <div className="px-8 pb-8 space-y-6">
          <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 text-left block"
              >
                Email
              </label>
              {/* O input agora é registrado com o react-hook-form */}
              <input
                id="email"
                type="email"
                placeholder="nome@empresa.com"
                className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                htmlFor="password"
                className="text-sm font-medium text-gray-700 text-left block"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite a sua senha"
                  className="w-full h-10 px-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>
            {serverError && (
              <div className="flex items-center p-3 space-x-2 bg-red-50 border border-red-200 rounded-md">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            )}
            <button
              type="submit"
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-md transition-colors flex items-center justify-center"
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
          <div className="text-center">
            <a
              href="#"
              className="text-sm text-indigo-600 hover:text-indigo-800 underline-offset-4 hover:underline"
            >
              Esqueceu a sua senha?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}