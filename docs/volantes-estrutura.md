# Estrutura de Volantes e Jogos - Bolão da Sorte

## Conceitos Fundamentais

### 🎫 **Volante**
- É o bilhete físico da loteria
- Cada volante contém múltiplos jogos
- Exemplo: "Volante 001", "Volante 002"

### 🎯 **Jogo (Linha)**
- É uma aposta individual dentro do volante
- Para Mega-Sena: 6 números de 1 a 60
- Cada volante pode ter até 10 jogos

## Estrutura no Banco Supabase

### Tabela `tickets` (representa volantes)
```sql
id: UUID
pool_id: UUID (referência ao bolão)
ticket_number: string (ex: "001", "002")
numbers: number[] (array com todos os números do volante)
created_at: timestamp
```

### Organização dos Números
Para um volante com 10 jogos de Mega-Sena:
```javascript
{
  ticket_number: "001",
  numbers: [
    // Jogo 1
    1, 5, 10, 15, 20, 25,
    // Jogo 2
    3, 8, 12, 18, 22, 30,
    // Jogo 3
    7, 11, 16, 21, 35, 40,
    // ... até Jogo 10
    // Total: 60 números (10 jogos × 6 números)
  ]
}
```

## Exemplo de Estrutura Completa

### Bolão com 3 Volantes
```javascript
// Pool
{
  id: "pool-uuid",
  name: "Bolão da Firma - Mega-Sena",
  num_tickets: 3 // 3 volantes
}

// Tickets (Volantes)
[
  {
    id: "ticket-1",
    pool_id: "pool-uuid",
    ticket_number: "001",
    numbers: [
      // 10 jogos de 6 números = 60 números
      1, 5, 10, 15, 20, 25,    // Jogo 1
      3, 8, 12, 18, 22, 30,    // Jogo 2
      7, 11, 16, 21, 35, 40,   // Jogo 3
      2, 9, 14, 19, 28, 33,    // Jogo 4
      4, 13, 17, 24, 31, 36,   // Jogo 5
      6, 15, 23, 29, 34, 41,   // Jogo 6
      8, 16, 25, 32, 37, 45,   // Jogo 7
      9, 18, 26, 38, 42, 48,   // Jogo 8
      11, 20, 27, 39, 43, 50,  // Jogo 9
      12, 21, 28, 44, 47, 55   // Jogo 10
    ]
  },
  {
    id: "ticket-2", 
    ticket_number: "002",
    numbers: [/* 60 números para 10 jogos */]
  },
  {
    id: "ticket-3",
    ticket_number: "003", 
    numbers: [/* 60 números para 10 jogos */]
  }
]
```

## Interface do Usuário

### Exibição por Volante
```
📋 Volante 001 (10 jogos)
├── Jogo 01: 01 05 10 15 20 25
├── Jogo 02: 03 08 12 18 22 30
├── Jogo 03: 07 11 16 21 35 40
└── ... até Jogo 10

📋 Volante 002 (10 jogos)
├── Jogo 01: 02 06 11 16 21 26
└── ... até Jogo 10
```

### Cadastro de Volantes
1. **Admin acessa bolão**
2. **Clica em "Adicionar Volante"**
3. **Gera 10 jogos aleatórios** ou **Cola jogos manualmente**
4. **Salva no banco** como array linear de 60 números
5. **Interface organiza** em 10 jogos de 6 números

## Regras de Negócio

### Validação de Jogos
- Cada jogo deve ter exatamente 6 números únicos
- Números devem estar entre 1 e 60 (Mega-Sena)
- Não pode haver números repetidos no mesmo jogo

### Cálculo de Total de Jogos
- Total de jogos = número de volantes × 10
- Exemplo: 5 volantes = 50 jogos

### Estrutura de Prêmios
- Prêmio por acerto depende do número de jogos total
- Mais jogos = mais chances = rateio maior

## Migração de Dados

Se já existem dados antigos:
1. **Identificar estrutura atual** dos tickets
2. **Reorganizar números** em grupos de 6
3. **Validar integridade** dos jogos
4. **Atualizar interface** para exibir por volantes