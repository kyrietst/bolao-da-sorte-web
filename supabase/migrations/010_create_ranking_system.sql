-- ===================================================================
-- MIGRAÇÃO 010: Sistema de Ranking e Competições
-- ===================================================================
-- Implementa sistema completo de ranking interno para bolões
-- Suporta competições por período e pontuação individual

-- 1. Enum para períodos de competição
CREATE TYPE competition_period AS ENUM ('mensal', 'trimestral', 'semestral', 'anual');
CREATE TYPE competition_status AS ENUM ('ativa', 'finalizada', 'pausada', 'agendada');

-- 2. Tabela de competições/temporadas
CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  period competition_period NOT NULL DEFAULT 'mensal',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  lottery_type VARCHAR(50) NOT NULL,
  status competition_status DEFAULT 'ativa',
  
  -- Configurações de pontuação
  points_per_hit INTEGER DEFAULT 1,
  bonus_points JSONB DEFAULT '{}', -- Bonificações especiais por tipo de acerto
  
  -- Metadados
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices e constraints
  CONSTRAINT valid_period CHECK (end_date > start_date),
  CONSTRAINT valid_lottery_type CHECK (lottery_type IN ('megasena', 'lotofacil', 'quina', 'lotomania', 'timemania', 'duplasena'))
);

-- 3. Tabela de resultados de loteria (para cachear resultados dos sorteios)
CREATE TABLE IF NOT EXISTS lottery_draw_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lottery_type VARCHAR(50) NOT NULL,
  draw_number VARCHAR(10) NOT NULL,
  draw_date DATE NOT NULL,
  numbers INTEGER[] NOT NULL,
  
  -- Informações adicionais do resultado
  accumulated BOOLEAN DEFAULT false,
  total_winners INTEGER DEFAULT 0,
  prizes JSONB DEFAULT '[]',
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices únicos
  UNIQUE(lottery_type, draw_number),
  UNIQUE(lottery_type, draw_date)
);

-- 4. Tabela de pontuação por sorteio
CREATE TABLE IF NOT EXISTS participant_draw_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  lottery_result_id UUID NOT NULL REFERENCES lottery_draw_results(id) ON DELETE CASCADE,
  
  -- Pontuação detalhada
  total_hits INTEGER DEFAULT 0,
  hit_breakdown JSONB DEFAULT '{}', -- Detalhamento por jogo: {"jogo1": 3, "jogo2": 0, ...}
  total_games_played INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  
  -- Prêmios
  prize_value DECIMAL(15,2) DEFAULT 0.00,
  prize_tier VARCHAR(50), -- "sena", "quina", "quadra", etc.
  
  -- Metadados
  draw_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(participant_id, competition_id, lottery_result_id),
  CONSTRAINT non_negative_hits CHECK (total_hits >= 0),
  CONSTRAINT non_negative_points CHECK (points_earned >= 0)
);

-- 5. Tabela de ranking consolidado por competição
CREATE TABLE IF NOT EXISTS competition_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  
  -- Estatísticas gerais
  total_points INTEGER DEFAULT 0,
  total_hits INTEGER DEFAULT 0,
  total_games_played INTEGER DEFAULT 0,
  total_prize_value DECIMAL(15,2) DEFAULT 0.00,
  
  -- Estatísticas avançadas
  best_hit_count INTEGER DEFAULT 0,
  draws_participated INTEGER DEFAULT 0,
  average_hits_per_draw DECIMAL(5,2) DEFAULT 0.00,
  consistency_score DECIMAL(5,2) DEFAULT 0.00, -- Pontuação de consistência
  
  -- Posição no ranking
  current_rank INTEGER DEFAULT 0,
  previous_rank INTEGER DEFAULT 0,
  rank_change INTEGER DEFAULT 0, -- +/- mudança de posição
  
  -- Metadados
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(participant_id, competition_id)
);

-- 6. Adicionar coluna has_ranking na tabela pools
ALTER TABLE pools ADD COLUMN IF NOT EXISTS has_ranking BOOLEAN DEFAULT false;
ALTER TABLE pools ADD COLUMN IF NOT EXISTS ranking_period competition_period DEFAULT 'mensal';

-- ===================================================================
-- ÍNDICES PARA PERFORMANCE
-- ===================================================================

-- Índices para competitions
CREATE INDEX IF NOT EXISTS idx_competitions_pool_id ON competitions(pool_id);
CREATE INDEX IF NOT EXISTS idx_competitions_period ON competitions(period);
CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);
CREATE INDEX IF NOT EXISTS idx_competitions_dates ON competitions(start_date, end_date);

-- Índices para lottery_draw_results
CREATE INDEX IF NOT EXISTS idx_lottery_results_type_date ON lottery_draw_results(lottery_type, draw_date);
CREATE INDEX IF NOT EXISTS idx_lottery_results_draw_number ON lottery_draw_results(lottery_type, draw_number);

-- Índices para participant_draw_scores
CREATE INDEX IF NOT EXISTS idx_draw_scores_participant ON participant_draw_scores(participant_id);
CREATE INDEX IF NOT EXISTS idx_draw_scores_competition ON participant_draw_scores(competition_id);
CREATE INDEX IF NOT EXISTS idx_draw_scores_date ON participant_draw_scores(draw_date);
CREATE INDEX IF NOT EXISTS idx_draw_scores_points ON participant_draw_scores(points_earned DESC);

-- Índices para competition_rankings
CREATE INDEX IF NOT EXISTS idx_rankings_competition ON competition_rankings(competition_id);
CREATE INDEX IF NOT EXISTS idx_rankings_rank ON competition_rankings(competition_id, current_rank);
CREATE INDEX IF NOT EXISTS idx_rankings_points ON competition_rankings(competition_id, total_points DESC);

-- ===================================================================
-- FUNÇÕES UTILITÁRIAS
-- ===================================================================

-- Função para calcular pontos baseado em acertos
CREATE OR REPLACE FUNCTION calculate_points_for_hits(
  hits INTEGER,
  lottery_type VARCHAR(50),
  base_points_per_hit INTEGER DEFAULT 1,
  bonus_config JSONB DEFAULT '{}'
) RETURNS INTEGER AS $$
DECLARE
  base_points INTEGER;
  bonus_points INTEGER := 0;
BEGIN
  -- Pontos base
  base_points := hits * base_points_per_hit;
  
  -- Bonificações especiais por tipo de loteria
  CASE lottery_type
    WHEN 'megasena' THEN
      CASE hits
        WHEN 6 THEN bonus_points := COALESCE((bonus_config->>'sena')::INTEGER, 1000);
        WHEN 5 THEN bonus_points := COALESCE((bonus_config->>'quina')::INTEGER, 500);
        WHEN 4 THEN bonus_points := COALESCE((bonus_config->>'quadra')::INTEGER, 100);
        ELSE bonus_points := 0;
      END CASE;
    WHEN 'lotofacil' THEN
      CASE hits
        WHEN 15 THEN bonus_points := COALESCE((bonus_config->>'15')::INTEGER, 1000);
        WHEN 14 THEN bonus_points := COALESCE((bonus_config->>'14')::INTEGER, 500);
        WHEN 13 THEN bonus_points := COALESCE((bonus_config->>'13')::INTEGER, 200);
        WHEN 12 THEN bonus_points := COALESCE((bonus_config->>'12')::INTEGER, 100);
        WHEN 11 THEN bonus_points := COALESCE((bonus_config->>'11')::INTEGER, 50);
        ELSE bonus_points := 0;
      END CASE;
    ELSE
      bonus_points := 0;
  END CASE;
  
  RETURN base_points + bonus_points;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar ranking de uma competição
CREATE OR REPLACE FUNCTION update_competition_ranking(comp_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Recalcular estatísticas consolidadas
  INSERT INTO competition_rankings (
    participant_id,
    competition_id,
    total_points,
    total_hits,
    total_games_played,
    total_prize_value,
    best_hit_count,
    draws_participated,
    average_hits_per_draw,
    last_updated
  )
  SELECT 
    pds.participant_id,
    comp_id,
    SUM(pds.points_earned) as total_points,
    SUM(pds.total_hits) as total_hits,
    SUM(pds.total_games_played) as total_games_played,
    SUM(pds.prize_value) as total_prize_value,
    MAX(pds.total_hits) as best_hit_count,
    COUNT(*) as draws_participated,
    CASE 
      WHEN COUNT(*) > 0 THEN ROUND(SUM(pds.total_hits)::DECIMAL / COUNT(*), 2)
      ELSE 0
    END as average_hits_per_draw,
    NOW()
  FROM participant_draw_scores pds
  WHERE pds.competition_id = comp_id
  GROUP BY pds.participant_id
  ON CONFLICT (participant_id, competition_id)
  DO UPDATE SET
    total_points = EXCLUDED.total_points,
    total_hits = EXCLUDED.total_hits,
    total_games_played = EXCLUDED.total_games_played,
    total_prize_value = EXCLUDED.total_prize_value,
    best_hit_count = EXCLUDED.best_hit_count,
    draws_participated = EXCLUDED.draws_participated,
    average_hits_per_draw = EXCLUDED.average_hits_per_draw,
    last_updated = NOW();
  
  -- Atualizar posições no ranking
  WITH ranked_participants AS (
    SELECT 
      participant_id,
      ROW_NUMBER() OVER (ORDER BY total_points DESC, total_hits DESC, average_hits_per_draw DESC) as new_rank
    FROM competition_rankings
    WHERE competition_id = comp_id
  )
  UPDATE competition_rankings cr
  SET 
    previous_rank = current_rank,
    current_rank = rp.new_rank,
    rank_change = CASE 
      WHEN current_rank = 0 THEN 0 -- Primeira vez
      ELSE current_rank - rp.new_rank
    END,
    last_updated = NOW()
  FROM ranked_participants rp
  WHERE cr.participant_id = rp.participant_id 
    AND cr.competition_id = comp_id;
END;
$$ LANGUAGE plpgsql;

-- Função para auto-criar competição quando pool tem ranking habilitado
CREATE OR REPLACE FUNCTION auto_create_competition_for_pool()
RETURNS TRIGGER AS $$
DECLARE
  comp_start_date DATE;
  comp_end_date DATE;
  comp_name VARCHAR(255);
BEGIN
  -- Só criar se ranking estiver habilitado
  IF NEW.has_ranking = true THEN
    -- Calcular datas baseado no período
    CASE NEW.ranking_period
      WHEN 'mensal' THEN
        comp_start_date := DATE_TRUNC('month', CURRENT_DATE);
        comp_end_date := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
        comp_name := 'Ranking ' || TO_CHAR(CURRENT_DATE, 'MM/YYYY');
      WHEN 'trimestral' THEN
        comp_start_date := DATE_TRUNC('quarter', CURRENT_DATE);
        comp_end_date := (DATE_TRUNC('quarter', CURRENT_DATE) + INTERVAL '3 months' - INTERVAL '1 day')::DATE;
        comp_name := 'Ranking Q' || TO_CHAR(CURRENT_DATE, 'Q/YYYY');
      WHEN 'semestral' THEN
        comp_start_date := CASE 
          WHEN EXTRACT(MONTH FROM CURRENT_DATE) <= 6 THEN DATE_TRUNC('year', CURRENT_DATE)
          ELSE (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '6 months')
        END;
        comp_end_date := (comp_start_date + INTERVAL '6 months' - INTERVAL '1 day')::DATE;
        comp_name := 'Ranking ' || TO_CHAR(comp_start_date, 'YYYY') || 
                     CASE WHEN EXTRACT(MONTH FROM comp_start_date) = 1 THEN '/1º Sem' ELSE '/2º Sem' END;
      WHEN 'anual' THEN
        comp_start_date := DATE_TRUNC('year', CURRENT_DATE);
        comp_end_date := (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year' - INTERVAL '1 day')::DATE;
        comp_name := 'Ranking ' || TO_CHAR(CURRENT_DATE, 'YYYY');
    END CASE;
    
    -- Inserir competição
    INSERT INTO competitions (
      pool_id,
      name,
      description,
      period,
      start_date,
      end_date,
      lottery_type,
      status,
      created_by
    ) VALUES (
      NEW.id,
      comp_name,
      'Competição automática do período ' || NEW.ranking_period::TEXT,
      NEW.ranking_period,
      comp_start_date,
      comp_end_date,
      NEW.lottery_type,
      'ativa',
      NEW.admin_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-criar competições
CREATE TRIGGER trigger_auto_create_competition
  AFTER INSERT OR UPDATE OF has_ranking, ranking_period
  ON pools
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_competition_for_pool();

-- ===================================================================
-- POLÍTICAS RLS (Row Level Security)
-- ===================================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_draw_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_draw_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_rankings ENABLE ROW LEVEL SECURITY;

-- Políticas para competitions
CREATE POLICY "Users can view competitions of their pools" ON competitions
  FOR SELECT USING (
    pool_id IN (
      SELECT pool_id FROM participants 
      WHERE user_id = auth.uid()
      UNION
      SELECT id FROM pools WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "Pool admins can manage competitions" ON competitions
  FOR ALL USING (
    pool_id IN (SELECT id FROM pools WHERE admin_id = auth.uid())
  );

-- Políticas para lottery_draw_results (leitura pública)
CREATE POLICY "Anyone can view lottery results" ON lottery_draw_results
  FOR SELECT USING (true);

CREATE POLICY "System can manage lottery results" ON lottery_draw_results
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para participant_draw_scores
CREATE POLICY "Users can view their own scores" ON participant_draw_scores
  FOR SELECT USING (
    participant_id IN (
      SELECT id FROM participants WHERE user_id = auth.uid()
    )
    OR
    competition_id IN (
      SELECT c.id FROM competitions c
      JOIN pools p ON c.pool_id = p.id
      WHERE p.admin_id = auth.uid()
    )
  );

-- Políticas para competition_rankings
CREATE POLICY "Users can view rankings of their competitions" ON competition_rankings
  FOR SELECT USING (
    competition_id IN (
      SELECT c.id FROM competitions c
      JOIN pools p ON c.pool_id = p.id
      JOIN participants pt ON pt.pool_id = p.id
      WHERE pt.user_id = auth.uid()
      UNION
      SELECT c.id FROM competitions c
      JOIN pools p ON c.pool_id = p.id
      WHERE p.admin_id = auth.uid()
    )
  );

-- ===================================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ===================================================================

COMMENT ON TABLE competitions IS 'Competições de ranking por período dentro dos bolões';
COMMENT ON TABLE lottery_draw_results IS 'Cache de resultados de sorteios das loterias';
COMMENT ON TABLE participant_draw_scores IS 'Pontuação detalhada por participante em cada sorteio';
COMMENT ON TABLE competition_rankings IS 'Ranking consolidado por competição';

COMMENT ON FUNCTION calculate_points_for_hits IS 'Calcula pontos baseado em acertos e configurações de bonificação';
COMMENT ON FUNCTION update_competition_ranking IS 'Atualiza ranking consolidado de uma competição';
COMMENT ON FUNCTION auto_create_competition_for_pool IS 'Cria automaticamente competições quando ranking é habilitado';