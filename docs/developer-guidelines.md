
# Diretrizes para Desenvolvimento - Bolão da Sorte

Este documento fornece diretrizes para desenvolvedores que contribuem para o projeto Bolão da Sorte. O objetivo é manter consistência no código, estilo e arquitetura à medida que o projeto evolui.

## Stack Tecnológica

### Frontend
- **React 18+ com TypeScript**: Utilize tipos estáticos sempre que possível para garantir segurança de tipos.
- **Vite**: Como bundler e ferramenta de desenvolvimento.
- **Tailwind CSS**: Para todo o estilo, evite CSS/SCSS inline ou arquivos separados.
- **shadcn/ui**: Como biblioteca de componentes base, personalizados com Tailwind.
- **React Router v6**: Para gerenciamento de rotas.
- **TanStack React Query**: Para requisições e gerenciamento de estado de servidor.

### Backend
- **Supabase**: Para autenticação, banco de dados e armazenamento.

## Estrutura de Arquivos

```
src/
  ├── components/       # Componentes reutilizáveis
  │   ├── ui/           # Componentes de UI básicos (shadcn)
  │   ├── dashboard/    # Componentes específicos do dashboard
  │   ├── lottery/      # Componentes relacionados às loterias
  │   └── pools/        # Componentes específicos para bolões
  ├── contexts/         # Contextos React (AuthContext, etc)
  ├── hooks/            # Custom hooks
  ├── integrations/     # Integrações com serviços externos
  │   └── supabase/     # Cliente e tipos do Supabase
  ├── layout/           # Componentes de layout
  ├── lib/              # Funções e utilitários
  ├── pages/            # Componentes de página
  ├── services/         # Serviços para interação com APIs
  └── types/            # Definições de tipos TypeScript
```

## Diretrizes de Código

### Padrões de Componentes

1. **Componentes Funcionais**: Use sempre componentes funcionais com hooks, não classes.

```tsx
// Correto
const MyComponent = () => {
  return <div>...</div>;
};

// Evitar
class MyComponent extends React.Component {
  render() {
    return <div>...</div>;
  }
}
```

2. **Props com TypeScript**: Defina interfaces para as props de componentes.

```tsx
interface ButtonProps {
  variant?: 'default' | 'outline' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
}

const Button = ({ variant = 'default', children, onClick }: ButtonProps) => {
  // ...
};
```

3. **Componentes Pequenos e Focados**: Mantenha componentes com uma única responsabilidade e tamanho reduzido (< 200 linhas).

### Estilo e UI

1. **Tailwind CSS**: Use classes Tailwind para todo o estilo. Evite CSS inline ou arquivos separados.

```tsx
// Correto
<div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">

// Evitar
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
```

2. **Tema de Cores**: Utilize as variáveis de cor do tema definidas no `tailwind.config.ts`. Por exemplo:
   - Background: `bg-background`, `bg-card`
   - Texto: `text-foreground`, `text-muted-foreground`
   - Bordas: `border-border`
   - Primário: `bg-primary`, `text-primary-foreground`

3. **Componentes shadcn/ui**: Use os componentes existentes do shadcn/ui e personalize-os com Tailwind quando necessário.

### Requisições e Estado

1. **Supabase Client**: Importe o cliente da seguinte forma:

```tsx
import { supabase } from "@/integrations/supabase/client";
```

2. **Padrão de Requisições**: Ao fazer requisições ao Supabase:

```tsx
// Exemplo de busca
const fetchData = async () => {
  try {
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('column', value);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error:', error);
    toast({
      title: "Erro ao buscar dados",
      description: error.message,
      variant: "destructive",
    });
  }
};
```

3. **React Query**: Para requisições que precisam ser cacheadas ou atualizadas automaticamente, use o hook `useQuery`:

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['unique-key', dependencyValue],
  queryFn: fetchData,
});
```

4. **Tipagem dos Dados**: Ao buscar dados do Supabase, use conversores de tipo para garantir consistência:

```tsx
// Exemplo de conversor
const convertSupabasePoolToPool = (pool: SupabasePool): Pool => {
  return {
    id: pool.id,
    name: pool.name,
    lotteryType: pool.lottery_type, // converte snake_case para camelCase
    // ...outros campos
  };
};
```

### Autenticação

1. **Contexto de Autenticação**: Use o `AuthContext` para acessar dados do usuário autenticado:

```tsx
const { user } = useAuth();
```

2. **Proteção de Rotas**: Use o componente `AuthGuard` para proteger rotas que requerem autenticação:

```tsx
<Route path="/protected" element={<AuthGuard><ProtectedComponent /></AuthGuard>} />
```

## Convenções de Nomenclatura

1. **Componentes**: PascalCase para nomes de componentes e arquivos de componentes (ex: `CreatePoolForm.tsx`).
2. **Hooks**: camelCase com prefixo "use" (ex: `useAuth.tsx`).
3. **Funções e Variáveis**: camelCase (ex: `fetchUserPools`).
4. **Tipos e Interfaces**: PascalCase (ex: `Pool`, `SupabasePool`).
5. **Arquivos de Páginas**: PascalCase (ex: `Dashboard.tsx`, `MyPools.tsx`).

## Manipulação de Dados do Supabase

1. **Conversão de Tipos**: Ao buscar dados do Supabase, sempre converta o formato snake_case do banco para camelCase no frontend:

```tsx
// Exemplo para bolões
const convertSupabasePoolToPool = (pool: SupabasePool): Pool => {
  return {
    id: pool.id,
    name: pool.name,
    lotteryType: pool.lottery_type as LotteryType,
    drawDate: pool.draw_date,
    numTickets: pool.num_tickets,
    maxParticipants: pool.max_participants,
    contributionAmount: Number(pool.contribution_amount),
    adminId: pool.admin_id,
    status: pool.status,
    createdAt: pool.created_at,
  };
};
```

2. **Cuidado com Tipos**: O Supabase retorna dados com tipagem genérica, sempre faça as conversões explícitas:

```tsx
// Conversão explícita para garantir o tipo correto
const poolsData = data?.map(pool => ({
  ...pool,
  lottery_type: pool.lottery_type as LotteryType
})) as SupabasePool[] || [];
```

## Gestão de Erros

1. **Toast para Notificações**: Use o hook `useToast` para exibir mensagens de erro e sucesso:

```tsx
const { toast } = useToast();

try {
  // operação...
  toast({
    title: "Operação bem-sucedida",
    description: "Os dados foram atualizados com sucesso.",
  });
} catch (error) {
  toast({
    title: "Erro na operação",
    description: error.message,
    variant: "destructive",
  });
}
```

2. **Estados de Carregamento**: Sempre informe ao usuário quando uma operação estiver em andamento:

```tsx
const [loading, setLoading] = useState(false);

const handleOperation = async () => {
  setLoading(true);
  try {
    // operação...
  } catch (error) {
    // tratamento de erro...
  } finally {
    setLoading(false);
  }
};

// No JSX
{loading ? <Loader2 className="animate-spin" /> : "Confirmar"}
```

## Componentes Comuns

### Botões
Use o componente `Button` com as variantes apropriadas:
```tsx
import { Button } from '@/components/ui/button';

<Button variant="default">Primário</Button>
<Button variant="outline">Secundário</Button>
<Button variant="destructive">Perigoso</Button>
```

### Formulários
Use componentes shadcn/ui para formulários:
```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

<div className="space-y-2">
  <Label htmlFor="name">Nome</Label>
  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
</div>
```

## Refatoração e Manutenção

1. **Monitoramento de Tamanho**: Quando um arquivo ultrapassar ~200 linhas, considere dividi-lo em componentes menores.
2. **Reutilização**: Extraia lógica comum para hooks e componentes reutilizáveis.
3. **Testes**: Adicione testes para funcionalidades críticas.

## Conclusão

Siga estas diretrizes para manter consistência e qualidade no código do projeto Bolão da Sorte. Lembre-se que código limpo, organizado e bem tipado facilita a manutenção e evolução do projeto.
