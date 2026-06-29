import type { FirebaseError } from 'firebase/app';

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function getAuthErrorMessage(error: unknown): string {
  const code = (error as FirebaseError)?.code;

  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado.';
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Tente novamente mais tarde.';
    default:
      return 'Ocorreu um erro. Tente novamente.';
  }
}
