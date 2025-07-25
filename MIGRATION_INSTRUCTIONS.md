# Instruções para Execução Manual da Migração 010 - Sistema de Ranking

## Problema Identificado

O erro "Bad Request" na criação de bolões está ocorrendo porque a migração `010_create_ranking_system.sql` não foi executada no banco de dados. As colunas `has_ranking` e `ranking_period` não existem na tabela `pools`, causando falha quando o sistema tenta criar bolões.

## Status Atual Verificado

✅ **Confirmado**: As seguintes estruturas NÃO existem no banco:
- Tabelas: `competitions`, `lottery_draw_results`, `participant_draw_scores`, `competition_rankings`
- Colunas na tabela `pools`: `has_ranking`, `ranking_period`
- Tipos ENUM: `competition_period`, `competition_status`

## Soluções para Executar a Migração

### Opção 1: Via Painel Web do Supabase (RECOMENDADO)

1. **Acesse o painel do Supabase**:
   - URL: https://supabase.com/dashboard
   - Projeto: `rwhtckssabkxeeewcdyl`

2. **Navegue para SQL Editor**:
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute em ordem**:
   
   **PASSO 1** - Execute o arquivo `manual_migration.sql`:
   ```sql
   -- Cole todo o conteúdo do arquivo manual_migration.sql aqui
   ```
   
   **PASSO 2** - Execute o arquivo `manual_migration_part2.sql`:
   ```sql
   -- Cole todo o conteúdo do arquivo manual_migration_part2.sql aqui
   ```

### Opção 2: Via psql (Command Line)

Se você tiver acesso à URL de conexão direta do PostgreSQL:

```bash
# Substitua pela URL real de conexão do seu banco
psql "postgresql://postgres:[password]@db.rwhtckssabkxeeewcdyl.supabase.co:5432/postgres" \
  -f manual_migration.sql

psql "postgresql://postgres:[password]@db.rwhtckssabkxeeewcdyl.supabase.co:5432/postgres" \
  -f manual_migration_part2.sql
```

### Opção 3: Via Supabase CLI com Login

Se conseguir fazer login no Supabase CLI:

```bash
# Fazer login
npx supabase login

# Executar as migrações
npx supabase db push
```

## Verificação Pós-Migração

Após executar a migração, você pode verificar se funcionou usando este comando Node.js:

```bash
node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://rwhtckssabkxeeewcdyl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aHRja3NzYWJreGVlZXdjZHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NjkxNzQsImV4cCI6MjA2MzM0NTE3NH0.ZLEOcuOZlIBgQDPMSBMoezIlsWQjU0fT83ECZbym_bU');

async function test() {
  const { data, error } = await supabase.from('pools').select('has_ranking, ranking_period').limit(1);
  console.log('Resultado:', error ? 'FALHOU - ' + error.message : 'SUCESSO - Colunas existem');
}
test();
"
```

## Resolução do Erro "Bad Request"

Uma vez que a migração seja executada com sucesso:

1. ✅ As colunas `has_ranking` e `ranking_period` estarão disponíveis na tabela `pools`
2. ✅ O sistema poderá criar bolões sem erro "Bad Request"
3. ✅ O sistema de ranking estará totalmente funcional
4. ✅ Triggers automáticos criarão competições quando ranking for habilitado

## Arquivos Incluídos

- `manual_migration.sql` - Criação de tipos ENUM, tabelas principais e estrutura básica
- `manual_migration_part2.sql` - Índices, funções e políticas RLS
- `010_create_ranking_system.sql` - Migração original completa

## Prioridade de Execução

🔥 **CRÍTICO**: Execute primeiro o `manual_migration.sql` (especialmente a seção que adiciona as colunas na tabela `pools`) para resolver imediatamente o erro "Bad Request".

O `manual_migration_part2.sql` pode ser executado em seguida para completar toda a funcionalidade do sistema de ranking.