import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://rwhtckssabkxeeewcdyl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aHRja3NzYWJreGVlZXdjZHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NjkxNzQsImV4cCI6MjA2MzM0NTE3NH0.ZLEOcuOZlIBgQDPMSBMoezIlsWQjU0fT83ECZbym_bU";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function verifyMigrationSuccess() {
  console.log('🔍 Verificando sucesso da migração do sistema de ranking...\n');
  
  let totalChecks = 0;
  let passedChecks = 0;
  
  // 1. Verificar novas tabelas
  console.log('📋 Verificando novas tabelas:');
  const newTables = ['competitions', 'lottery_draw_results', 'participant_draw_scores', 'competition_rankings'];
  
  for (const table of newTables) {
    totalChecks++;
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: OK`);
        passedChecks++;
      }
    } catch (err) {
      console.log(`   ❌ ${table}: ${err.message}`);
    }
  }
  
  // 2. Verificar novas colunas na tabela pools
  console.log('\n📋 Verificando novas colunas na tabela pools:');
  totalChecks++;
  try {
    const { data, error } = await supabase
      .from('pools')
      .select('has_ranking, ranking_period')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ Colunas has_ranking/ranking_period: ${error.message}`);
    } else {
      console.log(`   ✅ Colunas has_ranking/ranking_period: OK`);
      passedChecks++;
    }
  } catch (err) {
    console.log(`   ❌ Colunas has_ranking/ranking_period: ${err.message}`);
  }
  
  // 3. Testar criação de pool com ranking (teste final crítico)
  console.log('\n📋 Teste crítico - Criação de pool com ranking:');
  totalChecks++;
  try {
    const testPoolData = {
      name: 'Pool Teste Final - ' + new Date().toISOString(),
      lottery_type: 'megasena',
      max_participants: 10,
      has_ranking: true,
      ranking_period: 'mensal'
    };
    
    const { data, error } = await supabase
      .from('pools')
      .insert(testPoolData)
      .select()
      .single();
    
    if (error) {
      console.log(`   ❌ Criação de pool: ${error.message}`);
      if (error.message.includes('Bad Request')) {
        console.log(`   🚨 ERRO "Bad Request" ainda persiste!`);
      }
    } else {
      console.log(`   ✅ Criação de pool: SUCESSO!`);
      console.log(`   📝 Pool criada com ID: ${data.id}`);
      passedChecks++;
      
      // Limpar teste
      await supabase.from('pools').delete().eq('id', data.id);
      console.log(`   🧹 Pool de teste removida`);
    }
  } catch (err) {
    console.log(`   ❌ Criação de pool: ${err.message}`);
  }
  
  // 4. Verificar funções criadas
  console.log('\n📋 Verificando funções SQL criadas:');
  const functions = ['calculate_points_for_hits'];
  
  for (const func of functions) {
    totalChecks++;
    try {
      // Tentar chamar a função com parâmetros de teste
      const { data, error } = await supabase.rpc(func, {
        hits: 5,
        lottery_type: 'megasena',
        base_points_per_hit: 1,
        bonus_config: {}
      });
      
      if (error) {
        console.log(`   ❌ Função ${func}: ${error.message}`);
      } else {
        console.log(`   ✅ Função ${func}: OK (retornou: ${data})`);
        passedChecks++;
      }
    } catch (err) {
      console.log(`   ❌ Função ${func}: ${err.message}`);
    }
  }
  
  // 5. Resumo final
  console.log('\n📊 RESUMO DA VERIFICAÇÃO:');
  console.log('='.repeat(50));
  console.log(`✅ Verificações passaram: ${passedChecks}/${totalChecks}`);
  console.log(`📈 Taxa de sucesso: ${Math.round((passedChecks/totalChecks) * 100)}%`);
  
  if (passedChecks === totalChecks) {
    console.log('\n🎉 MIGRAÇÃO COMPLETAMENTE EXECUTADA!');
    console.log('✨ Sistema de ranking totalmente funcional');
    console.log('🚀 Erro "Bad Request" na criação de pools RESOLVIDO');
  } else if (passedChecks >= totalChecks - 2) {
    console.log('\n✅ MIGRAÇÃO MAJORITARIAMENTE EXECUTADA');
    console.log('🔧 Algumas funcionalidades avançadas podem não estar disponíveis');
    console.log('✨ Criação básica de pools deve funcionar');
  } else if (passedChecks >= 2) {
    console.log('\n⚠️  MIGRAÇÃO PARCIALMENTE EXECUTADA');
    console.log('🔄 Execute novamente os scripts de migração');
  } else {
    console.log('\n❌ MIGRAÇÃO NÃO EXECUTADA');
    console.log('🚨 Erro "Bad Request" ainda persiste');
    console.log('📝 Execute os scripts manual_migration.sql e manual_migration_part2.sql');
  }
  
  console.log('\n📋 Próximos passos recomendados:');
  if (passedChecks >= totalChecks - 1) {
    console.log('1. Gerar novos tipos TypeScript: npx supabase gen types typescript --linked > src/integrations/supabase/types.ts');
    console.log('2. Testar criação de pools na aplicação');
    console.log('3. Verificar funcionalidades de ranking');
  } else {
    console.log('1. Execute manual_migration.sql no painel do Supabase');
    console.log('2. Execute manual_migration_part2.sql no painel do Supabase');
    console.log('3. Execute este script novamente para verificar');
  }
}

verifyMigrationSuccess().then(() => {
  console.log('\n✨ Verificação finalizada');
  process.exit(0);
}).catch(err => {
  console.error('\n💥 Falha na verificação:', err);
  process.exit(1);
});