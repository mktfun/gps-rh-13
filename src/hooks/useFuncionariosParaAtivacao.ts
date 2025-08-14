import { useMemo } from 'react';

interface FuncionarioData {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  salario: number;
  data_nascimento: string;
  data_admissao: string;
  departamento?: string;
  status: string;
}

interface FuncionarioProcessado {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  salario: number;
  data_nascimento: string;
  data_admissao: string;
  departamento?: string;
  idade: number;
  tempo_empresa_dias: number;
}

export const useFuncionariosParaAtivacao = (funcionarios: FuncionarioData[]) => {
  return useMemo(() => {
    const funcionariosPendentes = funcionarios.filter(f => f.status === 'pendente');
    
    return funcionariosPendentes.map((funcionario): FuncionarioProcessado => {
      // Calculate age
      const birthDate = new Date(funcionario.data_nascimento);
      const today = new Date();
      let idade = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        idade--;
      }

      // Calculate days at company
      const admissionDate = new Date(funcionario.data_admissao);
      const tempo_empresa_dias = Math.floor((today.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: funcionario.id,
        nome: funcionario.nome,
        cpf: funcionario.cpf,
        cargo: funcionario.cargo,
        salario: funcionario.salario,
        data_nascimento: funcionario.data_nascimento,
        data_admissao: funcionario.data_admissao,
        departamento: funcionario.departamento,
        idade,
        tempo_empresa_dias
      };
    });
  }, [funcionarios]);
};
