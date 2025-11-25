import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { supabase } from "../lib/supabaseClient";
import { ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

// Esquema de validação atualizado
const schema = Yup.object().shape({
  email: Yup.string()
    .email("Digite um e-mail válido")
    .required("O campo e-mail é obrigatório"),

  senha: Yup.string()
    .min(3, "A senha deve ter no mínimo 3 caracteres")
    .required("O campo senha é obrigatório"),

  confirmarSenha: Yup.string()
    .oneOf([Yup.ref("senha")], "As senhas não coincidem")
    .required("Confirme sua senha"),
});

type FormData = Yup.InferType<typeof schema>;

export default function RecuperarSenha() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const handleRecuperarSenha = async (data: FormData) => {
    setIsLoading(true);
    setServerError("");
    setSuccessMessage("");

    try {
      const { email } = data;

      // Verificar se o email existe
      const { data: userData, error: userError } = await supabase
        .from("usuario")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (userError || !userData) {
        setServerError("Email não encontrado em nosso sistema.");
        setIsLoading(false);
        return;
      }

      // Simulação de envio de e-mail
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSuccessMessage("Instruções para redefinição de senha foram enviadas para seu email.");
      setIsLoading(false);

    } catch (err) {
      setServerError("Erro interno ao processar sua solicitação. Tente novamente.");
      setIsLoading(false);
    }
  };

  const handleVoltarLogin = () => {
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans">
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
        
        {/* Header voltar */}
        <div className="p-3 border-b border-gray-200">
          <button
            onClick={handleVoltarLogin}
            className="flex items-center text-odara-primary hover:text-odara-dark transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </button>
        </div>

        <div className="p-9 space-y-6 text-center">
          <h1 className="text-3xl font-bold text-odara-accent">
            Recuperar Senha
          </h1>
          <p className="text-sm text-odara-dark">
            Digite seu email e redefina sua senha
          </p>
        </div>

        <div className="px-8 pb-8 space-y-6">
          <form onSubmit={handleSubmit(handleRecuperarSenha)} className="space-y-4">

            {/* EMAIL */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-odara-dark block">
                Email
              </label>
              <input
                type="email"
                placeholder="Digite seu email"
                className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* SENHA NOVA */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-odara-dark block">
                Nova Senha
              </label>
              <input
                type="password"
                placeholder="Digite sua nova senha"
                className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
                {...register("senha")}
              />
              {errors.senha && (
                <p className="text-xs text-red-600">{errors.senha.message}</p>
              )}
            </div>

            {/* CONFIRMAR SENHA */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-odara-dark block">
                Confirmar Senha
              </label>
              <input
                type="password"
                placeholder="Confirme sua nova senha"
                className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
                {...register("confirmarSenha")}
              />
              {errors.confirmarSenha && (
                <p className="text-xs text-red-600">
                  {errors.confirmarSenha.message}
                </p>
              )}
            </div>

            {/* MENSAGENS */}
            {serverError && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}

            {/* BOTÃO */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-odara-accent hover:bg-odara-secondary text-white rounded-md flex items-center justify-center"
            >
              {isLoading ? "Enviando..." : "Enviar"}
            </button>

          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700">
            <AlertCircle className="w-4 h-4 inline-block mr-2" />
            Verifique também sua caixa de spam.
          </div>
        </div>
      </div>
    </div>
  );
}
