import { useState } from 'react';
import { useCreatePool } from '@/features/pools/hooks/useCreatePool';
import { LotteryType, CompetitionPeriod } from '@/types';
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
import { Loader2, Plus, Trophy, AlertCircle } from 'lucide-react';
import { LotteryDatePicker } from '@/components/ui/lottery-date-picker';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
            <LotteryDatePicker
              value={formState.drawDate}
              onChange={(value) => handleFieldChange('drawDate', value)}
              lotteryType={formState.lotteryType}
              required
            />
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

            {/* Seção de Ranking */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <Label htmlFor="has-ranking" className="text-sm font-medium">
                      Habilitar Ranking
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Crie competições internas com pontuação por acertos
                  </p>
                </div>
                <Switch
                  id="has-ranking"
                  checked={formState.hasRanking || false}
                  onCheckedChange={(value) => handleFieldChange('hasRanking', value)}
                />
              </div>

              {formState.hasRanking && (
                <div className="space-y-3 pl-6 border-l-2 border-yellow-200">
                  <div className="space-y-2">
                    <Label htmlFor="ranking-period">Período da Competição</Label>
                    <Select
                      value={formState.rankingPeriod || 'mensal'}
                      onValueChange={(value: CompetitionPeriod) => handleFieldChange('rankingPeriod', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="trimestral">Trimestral</SelectItem>
                        <SelectItem value="semestral">Semestral</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700">
                      <div className="space-y-1">
                        <p className="font-medium">Como funciona o ranking:</p>
                        <ul className="text-sm space-y-1">
                          <li>• Cada número acertado = 1 ponto base</li>
                          <li>• Bônus especiais para acertos principais (sena, quadra, etc.)</li>
                          <li>• Competições automáticas por período selecionado</li>
                          <li>• Ranking atualizado após cada sorteio</li>
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
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
