import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Wand2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AddVolanteFormProps {
  poolId: string;
  onVolanteAdded?: () => void;
}

export default function AddVolanteForm({ poolId, onVolanteAdded }: AddVolanteFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [jogosText, setJogosText] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewJogos, setPreviewJogos] = useState<number[][]>([]);
  const { toast } = useToast();

  // Função para gerar números aleatórios
  const gerarJogosAleatorios = () => {
    const jogos: number[][] = [];
    
    for (let i = 0; i < 10; i++) {
      const numbers: number[] = [];
      while (numbers.length < 6) {
        const num = Math.floor(Math.random() * 60) + 1;
        if (!numbers.includes(num)) {
          numbers.push(num);
        }
      }
      jogos.push(numbers.sort((a, b) => a - b));
    }
    
    setPreviewJogos(jogos);
    
    // Converter para texto para edição
    const texto = jogos
      .map((jogo, index) => `Jogo ${index + 1}: ${jogo.join(', ')}`)
      .join('\n');
    setJogosText(texto);
  };

  // Função para processar texto de jogos
  const processarJogos = (texto: string) => {
    try {
      const linhas = texto.trim().split('\n');
      const jogos: number[][] = [];
      
      for (const linha of linhas) {
        if (linha.trim()) {
          // Extrair números da linha (remove "Jogo X:" e pega só os números)
          const numerosMatch = linha.match(/\d+/g);
          if (numerosMatch) {
            const numbers = numerosMatch
              .map(n => parseInt(n))
              .filter(n => n >= 1 && n <= 60); // Validar range Mega-Sena
            
            if (numbers.length === 6) {
              jogos.push(numbers.sort((a, b) => a - b));
            }
          }
        }
      }
      
      setPreviewJogos(jogos);
      return jogos;
    } catch (error) {
      console.error('Erro ao processar jogos:', error);
      return [];
    }
  };

  // Salvar volante no banco
  const salvarVolante = async () => {
    if (previewJogos.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um jogo ao volante.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Criar array linear de números (6 números por jogo)
      const allNumbers = previewJogos.flat();
      
      // Gerar número do volante sequencial
      const { data: existingTickets } = await supabase
        .from('tickets')
        .select('ticket_number')
        .eq('pool_id', poolId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      const nextNumber = existingTickets && existingTickets.length > 0 
        ? parseInt(existingTickets[0].ticket_number) + 1 
        : 1;
      
      // Inserir volante
      const { error } = await supabase
        .from('tickets')
        .insert({
          pool_id: poolId,
          ticket_number: nextNumber.toString().padStart(3, '0'),
          numbers: allNumbers
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Volante ${nextNumber.toString().padStart(3, '0')} adicionado com ${previewJogos.length} jogos.`
      });

      // Reset form
      setJogosText('');
      setPreviewJogos([]);
      setIsOpen(false);
      onVolanteAdded?.();

    } catch (error) {
      console.error('Erro ao salvar volante:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar volante. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Button onClick={() => setIsOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Volante
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Adicionar Novo Volante
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Adicione um volante com até 10 jogos de 6 dezenas cada
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botão para gerar aleatório */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={gerarJogosAleatorios}
            className="gap-2"
            type="button"
          >
            <Wand2 className="h-4 w-4" />
            Gerar 10 Jogos Aleatórios
          </Button>
        </div>

        {/* Área de texto para jogos */}
        <div className="space-y-2">
          <Label htmlFor="jogos">
            Jogos (um por linha ou cole texto)
          </Label>
          <Textarea
            id="jogos"
            placeholder="Jogo 1: 01, 05, 10, 15, 20, 25&#10;Jogo 2: 03, 08, 12, 18, 22, 30&#10;..."
            value={jogosText}
            onChange={(e) => {
              setJogosText(e.target.value);
              processarJogos(e.target.value);
            }}
            rows={8}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Formato: "Jogo 1: 01, 05, 10, 15, 20, 25" ou apenas "01, 05, 10, 15, 20, 25"
          </p>
        </div>

        {/* Preview dos jogos */}
        {previewJogos.length > 0 && (
          <div className="space-y-2">
            <Label>Preview ({previewJogos.length} jogos)</Label>
            <div className="max-h-40 overflow-y-auto space-y-2 p-2 border rounded">
              {previewJogos.map((jogo, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-12">
                    #{index + 1}
                  </span>
                  <div className="flex gap-1">
                    {jogo.map((num, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {num.toString().padStart(2, '0')}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={salvarVolante} 
            disabled={loading || previewJogos.length === 0}
            className="flex-1"
          >
            {loading ? 'Salvando...' : 'Salvar Volante'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setIsOpen(false);
              setJogosText('');
              setPreviewJogos([]);
            }}
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}