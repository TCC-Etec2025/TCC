import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
<<<<<<< HEAD
import { supabase } from "../lib/supabaseClient";

// --- Esquema de Validação (sem alterações) ---
=======
import { supabase } from "../supabaseClient";

// --- Esquema de Validação ---
>>>>>>> 682d0eb60ca0ae658f329691dc12e2745ca0990e
const schema = Yup.object().shape({
  email: Yup.string()
    .email("Digite um e-mail válido")
    .required("O campo e-mail é obrigatório"),
  password: Yup.string().required("O campo senha é obrigatório"),
});

type FormData = Yup.InferType<typeof schema>;

<<<<<<< HEAD
// --- Componentes de Ícones (sem alterações) ---
type IconProps = { className?: string };
const Eye = ({ className }: IconProps) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}> <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /> <circle cx="12" cy="12" r="3" /> </svg> );
const EyeOff = ({ className }: IconProps) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}> <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /> <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /> <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /> <line x1="2" x2="22" y1="2" y2="22" /> </svg> );
const AlertTriangle = ({ className }: IconProps) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}> <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /> <line x1="12" x2="12" y1="9" y2="13" /> <line x1="12" x2="12.01" y1="17" y2="17" /> </svg> );

=======
// --- Componentes de Ícones Simplificados ---
type IconProps = { className?: string };

const Eye = ({ className }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOff = ({ className }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);
const AlertTriangle = ({ className }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" x2="12" y1="9" y2="13" />
    <line x1="12" x2="12.01" y1="17" y2="17" />
  </svg>
);
>>>>>>> 682d0eb60ca0ae658f329691dc12e2745ca0990e

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
<<<<<<< HEAD

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  // A função de login agora é muito mais simples
=======

  // --- Configuração do React Hook Form ---
  // ALTERE ESTA LINHA
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  // A sua função de lógica de negócio agora recebe os dados do formulário
>>>>>>> 682d0eb60ca0ae658f329691dc12e2745ca0990e
  const handleLogin = async (data: FormData) => {
    setIsLoading(true);
    setServerError("");

    const { email, password } = data;

<<<<<<< HEAD
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
=======
    // A lógica de autenticação com o Supabase permanece a mesma
    const { data: authData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
>>>>>>> 682d0eb60ca0ae658f329691dc12e2745ca0990e
      setServerError("Email ou senha inválidos. Por favor, tente novamente.");
      setIsLoading(false);
      return;
    }

<<<<<<< HEAD
    // SUCESSO! Apenas navegue para a rota "mãe" protegida.
    // O onAuthStateChange no AuthContext cuidará de buscar o perfil
    // e o novo componente DashboardRedirect cuidará do resto.
    navigate("/app", { replace: true });

    // O setIsLoading(false) não é estritamente necessário aqui,
    // pois a página será desmontada, mas é uma boa prática.
=======
    if (authData.user) {
      const { data: role, error: rpcError } = await supabase.rpc("get_my_role");

      if (rpcError || !role) {
        setServerError("Perfil de utilizador não encontrado no sistema.");
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      // SUCESSO! Agora, redirecione com base no perfil.
      if (role === "Admin") {
        navigate("/app/admin");
      } else if (role === "Responsavel") {
        navigate("/app/responsavel");
      } else if (role === "Cuidador" || role === "Enfermagem") {
        navigate("/app/funcionario");
      } else {
        // Caso de segurança: perfil desconhecido
        setServerError("Perfil de usuário desconhecido.");
        await supabase.auth.signOut();
      }

    }

>>>>>>> 682d0eb60ca0ae658f329691dc12e2745ca0990e
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
<<<<<<< HEAD
          <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 text-left block">
=======
          {/* O onSubmit agora usa o handleSubmit do React Hook Form para "embrulhar" a sua função */}
          <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 text-left block"
              >
>>>>>>> 682d0eb60ca0ae658f329691dc12e2745ca0990e
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
<<<<<<< HEAD
=======
              {/* Exibição do erro de validação */}
>>>>>>> 682d0eb60ca0ae658f329691dc12e2745ca0990e
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
<<<<<<< HEAD
              <label htmlFor="password" className="text-sm font-medium text-gray-700 text-left block">
=======
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 text-left block"
              >
>>>>>>> 682d0eb60ca0ae658f329691dc12e2745ca0990e
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
<<<<<<< HEAD
=======

            {/* Exibição do erro vindo do servidor (Supabase) */}
>>>>>>> 682d0eb60ca0ae658f329691dc12e2745ca0990e
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
<<<<<<< HEAD
}
=======
}
>>>>>>> 682d0eb60ca0ae658f329691dc12e2745ca0990e
