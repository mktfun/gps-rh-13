/**
 * Formata um valor numérico como moeda brasileira (BRL)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata um número com separadores de milhares
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Formata um valor como porcentagem
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Formata um CNPJ com máscara
 */
export function formatCnpj(cnpj: string): string {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  return cleanCnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Formata uma data para exibição brasileira
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR');
}

/**
 * Formata um nome de mês para abreviação
 */
export function formatMonthName(monthStr: string): string {
  const months: Record<string, string> = {
    '01': 'Jan',
    '02': 'Fev',
    '03': 'Mar',
    '04': 'Abr',
    '05': 'Mai',
    '06': 'Jun',
    '07': 'Jul',
    '08': 'Ago',
    '09': 'Set',
    '10': 'Out',
    '11': 'Nov',
    '12': 'Dez',
  };
  
  // Se monthStr estiver no formato YYYY-MM, extrair apenas MM
  const month = monthStr.includes('-') ? monthStr.split('-')[1] : monthStr;
  return months[month] || monthStr;
}

/**
 * Calcula a variação percentual entre dois valores
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Formata um número grande com abreviações (1K, 1M, etc.)
 */
export function formatCompactNumber(value: number): string {
  const formatter = new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    compactDisplay: 'short',
  });
  return formatter.format(value);
}

/**
 * Trunca um texto com ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Formata um status para exibição
 */
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    ativo: 'Ativo',
    pendente: 'Pendente',
    inativo: 'Inativo',
    cancelado: 'Cancelado',
    suspenso: 'Suspenso',
  };
  
  return statusMap[status.toLowerCase()] || status;
}

/**
 * Gera cores consistentes para gráficos
 */
export function getChartColors(index: number): string {
  const colors = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
    '#f97316', // orange-500
    '#ec4899', // pink-500
    '#6366f1', // indigo-500
  ];
  
  return colors[index % colors.length];
}
