/**
 * Utilitário para recarregar a página após atualizações
 */

export const recarregarPagina = () => {
  window.location.reload();
};

export const recarregarAposDelay = (delay: number = 1500) => {
  setTimeout(() => {
    window.location.reload();
  }, delay);
};

export const redirecionarERecarregar = (url: string) => {
  window.location.href = url;
};