import { useState } from 'react';
import { useCreatePool } from '@/features/pools/hooks/useCreatePool';
import { LotteryType } from '@/types';
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

interface CreatePoolFormProps {
  buttonVariant?: 'default' | 'outline' | 'secondary';
  buttonSize?: 'default' | 'sm' | 'lg';
  fullWidth?: boolean;
}

export default function CreatePoolForm({
  buttonVariant = 'default',
  buttonSize = 'default',
  fullWidth = false,
}: CreatePoolFormProps) {
  const [open, setOpen] = useState(false);
  const { loading, formState, handleFieldChange, createPool } = useCreatePool();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const poolId = await createPool();
    if (poolId) {
      setOpen(false); // Fecha o modal apenas se o bolão for criado com sucesso
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
        <form onSubmit={handleSubmit}>
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
                value={formState.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Ex: Mega da Virada 2025"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lottery-type">Tipo de Loteria</Label>
              <Select
                value={formState.lotteryType}
                onValueChange={(value: LotteryType) => handleFieldChange('lotteryType', value)}
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
                value={formState.drawDate}
                onChange={(e) => handleFieldChange('drawDate', e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="num-tickets">Nº de Bilhetes</Label>
                <Input
                  id="num-tickets"
                  type="number"
                  value={formState.numTickets}
                  onChange={(e) => handleFieldChange('numTickets', Number(e.target.value))}
                  required
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-participants">Max. Participantes</Label>
                <Input
                  id="max-participants"
                  type="number"
                  value={formState.maxParticipants}
                  onChange={(e) => handleFieldChange('maxParticipants', Number(e.target.value))}
                  required
                  min={2}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contribution-amount">Valor da Cota (R$)</Label>
              <Input
                id="contribution-amount"
                type="number"
                value={formState.contributionAmount}
                onChange={(e) => handleFieldChange('contributionAmount', Number(e.target.value))}
                required
                min={1}
                step={0.01}
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
