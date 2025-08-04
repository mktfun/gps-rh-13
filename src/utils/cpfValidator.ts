
export const formatCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};

export const isValidCPF = (cpf: string): boolean => {
  const cleanCPF = formatCPF(cpf);
  
  // Verificar se tem 11 dígitos
  if (cleanCPF.length !== 11) {
    return false;
  }
  
  // Verificar se todos os dígitos são iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return false;
  }
  
  // Calcular primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let firstDigit = 11 - (sum % 11);
  if (firstDigit >= 10) firstDigit = 0;
  
  // Verificar primeiro dígito
  if (parseInt(cleanCPF.charAt(9)) !== firstDigit) {
    return false;
  }
  
  // Calcular segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  let secondDigit = 11 - (sum % 11);
  if (secondDigit >= 10) secondDigit = 0;
  
  // Verificar segundo dígito
  return parseInt(cleanCPF.charAt(10)) === secondDigit;
};

export const getCPFValidationMessage = (cpf: string): string | null => {
  const cleanCPF = formatCPF(cpf);
  
  if (cleanCPF.length !== 11) {
    return 'CPF deve ter 11 dígitos';
  }
  
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return 'CPF não pode ter todos os dígitos iguais';
  }
  
  if (!isValidCPF(cpf)) {
    return 'CPF inválido - dígitos verificadores incorretos';
  }
  
  return null;
};
