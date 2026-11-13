/**
 * Utilitário para gerar URLs de acesso ao Modo Aluno e Modo Professor
 * Fornece a URL ativa e também a URL pública compartilhável (sem bloqueio de login)
 */

export function getPublicStudentUrl(): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  return `${origin}/?modo=aluno`;
}

export function getPublicTeacherUrl(): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  return `${origin}/?modo=professor`;
}

/**
 * Se o app estiver rodando no domínio de desenvolvimento privado (ais-dev-),
 * retorna também a versão do link compartilhado público (ais-pre-).
 */
export function getAlternateSharedUrl(mode: 'aluno' | 'professor' = 'aluno'): string | null {
  if (typeof window === 'undefined') return null;
  const origin = window.location.origin;
  if (origin.includes('ais-dev-')) {
    return `${origin.replace('ais-dev-', 'ais-pre-')}/?modo=${mode}`;
  }
  return null;
}
