export const formatCPF = (cpf?: string) => {
    if (!cpf) return '';
    const digits = cpf.replace(/\D/g, '').slice(0, 11);
    let value = digits;
    if (digits.length > 3) value = digits.replace(/^(\d{3})(\d{1,3})/, '$1.$2');
    if (digits.length > 6) value = value.replace(/^(\d{3})\.(\d{3})(\d{1,3})/, '$1.$2.$3');
    if (digits.length > 9) value = value.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    return value;
};

export const formatTelefone = (telefone?: string) => {
    if (!telefone) return '';
    const digits = telefone.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
        return digits.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    }
    return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
};

export const formatCEP = (cep?: string) => {
    if (!cep) return '';
    const digits = cep.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 5) return digits.replace(/^(\d{5})(\d{1,3})/, '$1-$2');
    return digits;
};

export const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("pt-BR");
};

export const removeFormatting = (value?: string) => {
    return value ? value.replace(/\D/g, '') : '';
};