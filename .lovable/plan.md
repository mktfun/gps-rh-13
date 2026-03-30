

# Two tasks: Build error fix + PDF manual for empresa

## 1. Fix build error in Sidebar.tsx

**Problem**: Line 28 destructures `{ totalPendencias }` from `usePendenciasDaCorretora()`, but the hook returns a standard `useQuery` result (`{ data, isLoading, ... }`). There is no `totalPendencias` property.

**Fix**: Change line 28 to destructure `data` and derive totalPendencias from it:
```ts
const { data: pendencias } = usePendenciasDaCorretora();
const totalPendencias = pendencias?.length ?? 0;
```

| File | Change |
|------|--------|
| `src/components/layout/Sidebar.tsx` | Fix destructuring of `usePendenciasDaCorretora` |

## 2. Generate PDF manual for empresa users

Create a professional PDF using ReportLab based on the content already in `MANUAL_USUARIO_EMPRESA.md`. The PDF will include:

- Cover page with "GPS RH -- Manual do Usuario Empresa"
- Table of contents
- All 10 sections from the markdown manual, formatted with headings, tables, bullet lists, and tip/warning callout boxes
- FAQ and support sections
- Clean, professional formatting suitable for sending to HR staff

Output: `/mnt/documents/Manual_Usuario_Empresa_GPS_RH.pdf`

