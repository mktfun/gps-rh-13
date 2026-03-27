

# Fix: Logout não funciona (só recarrega a página)

## Problema

A função `signOut` em `useAuth.tsx`:
1. Chama `setIsLoading(true)` -- isso re-renderiza o RootLayout mostrando loading
2. Chama `await supabase.auth.signOut()` -- pode falhar silenciosamente
3. Chama `window.location.href = '/login'` -- faz hard reload

O `window.location.href` causa um reload completo da página. Se o `signOut` do Supabase falhar ou não completar antes do reload, a sessão persiste no localStorage e o usuário é redirecionado de volta pelo `PublicLayout` (que detecta usuário autenticado e redireciona para o dashboard).

## Solução

### Arquivo: `src/hooks/useAuth.tsx` -- função `signOut`

1. **Limpar estado local PRIMEIRO** (user, session, role, empresaId, branding) antes de chamar o Supabase
2. **Limpar localStorage manualmente** como fallback (`localStorage.removeItem` das keys do Supabase)
3. **NÃO usar `setIsLoading(true)`** -- evita re-render desnecessário antes do redirect
4. **Usar `window.location.replace('/login')`** em vez de `href` para não adicionar ao histórico
5. **Wrap tudo em try/finally** para garantir redirect mesmo se signOut falhar

```
const signOut = async () => {
  // 1. Limpar estado React imediatamente
  setUser(null); setSession(null); setRole(null); ...
  
  // 2. Tentar signOut no Supabase
  try { await supabase.auth.signOut(); } catch (e) { /* ignore */ }
  
  // 3. Fallback: limpar storage manualmente
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-')) localStorage.removeItem(key);
  });
  
  // 4. Redirect
  window.location.replace('/login');
};
```

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/hooks/useAuth.tsx` | Edição | Reescrever `signOut` para limpar estado + storage antes de redirecionar |

