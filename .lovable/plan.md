

# Fix: White screen caused by broken auth query

## Problem

The `getUserData` function in `useAuth.tsx` tries to join `profiles` with `empresa_branding` using `empresa_branding_empresa_id_fkey`, but that foreign key doesn't exist in the database. PostgREST returns error `PGRST200`, causing `role` to be `null`, which breaks all routing and renders a white screen.

The `corretora_branding` join may have the same issue but happens to work if that FK exists.

## Fix

Rewrite `getUserData` in `src/hooks/useAuth.tsx` to use two separate queries instead of one joined query:

1. **Query 1**: Fetch `role` and `empresa_id` from `profiles` (simple, no joins)
2. **Query 2** (conditional): If role is `corretora`, fetch branding from `corretora_branding`. If role is `empresa`, fetch branding from `empresa_branding` using the `empresa_id`.

This eliminates the broken FK join entirely.

### Code change

```typescript
const getUserData = async (user: User) => {
  // Step 1: Get profile (no joins)
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, empresa_id')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    logger.error('[AUTH] Erro ao buscar perfil:', error);
    return { role: null, empresaId: null, branding: null };
  }

  // Step 2: Get branding based on role
  let branding: BrandingData | null = null;

  if (profile.role === 'corretora') {
    const { data: cb } = await supabase
      .from('corretora_branding')
      .select('logo_url, cor_primaria')
      .eq('corretora_id', user.id)
      .maybeSingle();
    if (cb) branding = { logo_url: cb.logo_url, cor_primaria: cb.cor_primaria };
  } else if (profile.role === 'empresa' && profile.empresa_id) {
    const { data: eb } = await supabase
      .from('empresa_branding')
      .select('logo_url')
      .eq('empresa_id', profile.empresa_id)
      .maybeSingle();
    if (eb) branding = { logo_url: eb.logo_url };
  }

  return {
    role: profile.role,
    empresaId: profile.empresa_id,
    branding
  };
};
```

| File | Change |
|------|--------|
| `src/hooks/useAuth.tsx` | Replace `getUserData` function (lines 28-70) to use separate queries instead of broken FK join |

