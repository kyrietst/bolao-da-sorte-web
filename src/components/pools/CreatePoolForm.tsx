
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LotteryType } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';

type CreatePoolFormProps = {
  buttonVariant?: 'default' | 'outline' | 'secondary';
  buttonSize?: 'default' | 'sm' | 'lg';
  fullWidth?: boolean;
};

export default function CreatePoolForm({
  buttonVariant = 'default',
  buttonSize = 'default',
  fullWidth = false,
}: CreatePoolFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [lotteryType, setLotteryType] = useState<LotteryType>('megasena');
  const [drawDate, setDrawDate] = useState('');
  const [numTickets, setNumTickets] = useState(1);
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [contributionAmount, setContributionAmount] = useState(10);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setLotteryType('megasena');
    setDrawDate('');
    setNumTickets(1);
    setMaxParticipants(10);
    setContributionAmount(10);
  };

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro ao criar bolão",
        description: "Você precisa estar logado para criar um bolão.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Converte a data de string para objeto Date
      const formattedDate = new Date(drawDate).toISOString();

      const { data, error } = await supabase
        .from('pools')
        .insert([
          {
            name,
            lottery_type: lotteryType,
            draw_date: formattedDate,
            num_tickets: numTickets,
            max_participants: maxParticipants,
            contribution_amount: contributionAmount,
            admin_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Bolão criado com sucesso!",
        description: `Seu bolão "${name}" foi criado.`,
      });

      // Inserir o admin como participante automático do bolão
      await supabase.from('participants').insert([
        {
          user_id: user.id,
          pool_id: data.id,
          name: user.user_metadata?.name || 'Admin',
          email: user.email,
          status: 'confirmado'
        }
      ]);

      resetForm();
      setOpen(false);
      
      // Navegar para a página de detalhes do bolão
      navigate(`/boloes/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Erro ao criar bolão",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const lotteryOptions: { value: LotteryType; label: string }[] = [
    { value: 'megasena', label: 'Mega-Sena' },
    { value: 'lotofacil', label: 'Lotofácil' },
    { value: 'quina', label: 'Quina' },
    { value: 'lotomania', label: 'Lotomania' },
    { value: 'timemania', label: 'Timemania' },
    { value: 'duplasena', label: 'Dupla Sena' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={buttonVariant} 
          size={buttonSize} 
          className={fullWidth ? "w-full" : ""}
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar Novo Bolão
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleCreatePool}>
          <DialogHeader>
            <DialogTitle>Criar Novo Bolão</DialogTitle>
            <DialogDescription>
              Preencha as informações para criar um novo bolão.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Bolão</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Mega da Virada 2025"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lottery-type">Tipo de Loteria</Label>
              <Select
                value={lotteryType}
                onValueChange={(value: LotteryType) => setLotteryType(value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de loteria" />
                </SelectTrigger>
                <SelectContent>
                  {lotteryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="draw-date">Data do Sorteio</Label>
              <Input
                id="draw-date"
                type="date"
                value={drawDate}
                onChange={(e) => setDrawDate(e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="num-tickets">Número de Bilhetes</Label>
                <Input
                  id="num-tickets"
                  type="number"
                  value={numTickets}
                  onChange={(e) => setNumTickets(Number(e.target.value))}
                  min={1}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-participants">Máximo de Participantes</Label>
                <Input
                  id="max-participants"
                  type="number"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  min={1}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contribution">Valor da Contribuição (R$)</Label>
              <Input
                id="contribution"
                type="number"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(Number(e.target.value))}
                min={1}
                step="0.01"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Bolão"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
