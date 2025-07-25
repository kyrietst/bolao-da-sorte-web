# 🚀 INSTRUÇÕES PARA APLICAR MIGRAÇÃO DO SISTEMA DE RANKING

## ⚡ SOLUÇÃO RÁPIDA (Para resolver o erro "Bad Request")

### Passo 1: Acessar Supabase
1. Vá para: https://supabase.com/dashboard/project/rwhtckssabkxeeewcdyl
2. Faça login na sua conta
3. No menu lateral, clique em **"SQL Editor"**
4. Clique em **"New Query"**

### Passo 2: Executar SQL Essencial
Copie e cole o conteúdo do arquivo `apply_ranking_essential.sql` e clique em **"Run"**.

Este SQL irá:
- ✅ Criar os tipos ENUM necessários
- ✅ Adicionar as colunas `has_ranking` e `ranking_period` na tabela `pools`
- ✅ Resolver o erro "Bad Request" na criação de bolões

### Passo 3: Verificar Sucesso
Após executar, você deve ver uma tabela mostrando:
```
column_name      | data_type          | is_nullable | column_default
has_ranking      | boolean            | YES         | false
ranking_period   | competition_period | YES         | 'mensal'::competition_period
```

---

## 🏆 MIGRAÇÃO COMPLETA (Para sistema de ranking completo)

Para implementar todas as funcionalidades de ranking, execute também:

### Passo 4: Migração Completa
Copie e cole o conteúdo do arquivo `010_create_ranking_system.sql` em uma nova query.

Esta migração completa irá criar:
- ✅ Tabela `competitions` - Competições por período
- ✅ Tabela `lottery_draw_results` - Cache de resultados
- ✅ Tabela `participant_draw_scores` - Pontuações por sorteio
- ✅ Tabela `competition_rankings` - Rankings consolidados
- ✅ Funções SQL para cálculo automático
- ✅ Triggers para criação automática de competições
- ✅ Políticas RLS para segurança

---

## 🔍 VERIFICAÇÃO

### Testar Criação de Bolão
1. Volte para a aplicação
2. Tente criar um novo bolão
3. Verifique se as opções de ranking aparecem
4. O erro "Bad Request" deve ter desaparecido

### Verificar Tabelas Criadas
Execute no SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('competitions', 'lottery_draw_results', 'participant_draw_scores', 'competition_rankings');
```

---

## ❗ IMPORTANTE

- Execute primeiro `apply_ranking_essential.sql` para resolver o erro imediato
- Execute depois `010_create_ranking_system.sql` para funcionalidades completas
- Não é necessário executar em partes - pode executar tudo de uma vez
- As migrações têm proteções contra execução duplicada

---

## 🆘 EM CASO DE ERRO

Se algo der errado, você pode verificar o log de erros no SQL Editor do Supabase e:

1. **Erro de tipo já existente**: Normal, pode ignorar
2. **Erro de coluna já existente**: Normal, pode ignorar  
3. **Erro de permissão**: Verifique se está logado como proprietário do projeto

---

## ✅ RESULTADO FINAL

Após aplicar as migrações:
- ✅ Formulário de criação de bolão funcionará
- ✅ Opções de ranking aparecerão na interface
- ✅ Sistema completo de competições estará ativo
- ✅ Pontuações serão calculadas automaticamente