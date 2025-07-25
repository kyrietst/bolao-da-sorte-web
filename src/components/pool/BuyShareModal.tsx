import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  CreditCard, 
  CheckCircle, 
  User,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Pool } from '@/types';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { toast } from 'sonner';

interface BuyShareModalProps {
  pool: Pool;
  currentParticipants: number;
  children: React.ReactNode;
}

interface ParticipantData {
  name: string;
  email: string;
  phone: string;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value);
};

export default function BuyShareModal({ pool, currentParticipants, children }: BuyShareModalProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'selection' | 'participant' | 'payment' | 'success'>('selection');
  const [loading, setLoading] = useState(false);
  
  const [shares, setShares] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit' | 'debit'>('pix');
  const [participantData, setParticipantData] = useState<ParticipantData>({
    name: user?.user_metadata?.name || '',
    email: user?.email || '',
    phone: ''
  });

  const availableShares = Math.max(0, pool.maxParticipants - currentParticipants);
  const totalCost = shares * pool.contributionAmount;
  const maxShares = Math.min(availableShares, 5); // Limite de 5 cotas por pessoa

  const handleNextStep = () => {
    if (step === 'selection') {
      setStep('participant');
    } else if (step === 'participant') {
      setStep('payment');
    }
  };

  const handlePrevStep = () => {
    if (step === 'participant') {
      setStep('selection');
    } else if (step === 'payment') {
      setStep('participant');
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    
    // Simular processamento de pagamento
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Aqui seria feita a integração real com:
      // 1. Supabase para adicionar participante
      // 2. Sistema de pagamento (PIX, cartão)
      // 3. Envio de email de confirmação
      
      setStep('success');
      toast.success('Compra realizada com sucesso!');
      
    } catch (error) {
      toast.error('Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStep('selection');
    setShares(1);
    setParticipantData({
      name: user?.user_metadata?.name || '',
      email: user?.email || '',
      phone: ''
    });
  };

  const isFormValid = participantData.name && participantData.email && participantData.phone;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={availableShares > 0 ? undefined : (e) => e.preventDefault()}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-green-500" />
            Comprar Cota - {pool.name}
          </DialogTitle>
        </DialogHeader>

        {/* Etapa 1: Seleção de Cotas */}
        {step === 'selection' && (
          <div className="space-y-6">
            {/* Informações do Bolão */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Informações do Bolão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Modalidade</Label>
                    <p className="font-medium">Mega-Sena</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Data do Sorteio</Label>
                    <p className="font-medium">{new Date(pool.drawDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Valor por Cota</Label>
                    <p className="font-medium text-green-600">{formatCurrency(pool.contributionAmount)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Total de Volantes</Label>
                    <p className="font-medium">{pool.numTickets} volantes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seleção de Quantidade */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quantas cotas deseja comprar?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableShares === 0 ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Este bolão está lotado. Não há mais cotas disponíveis.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Quantidade de cotas</Label>
                        <Badge variant="outline">
                          {availableShares} disponível{availableShares !== 1 ? 'is' : ''}
                        </Badge>
                      </div>
                      <Select 
                        value={shares.toString()} 
                        onValueChange={(value) => setShares(Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: maxShares }, (_, i) => i + 1).map(num => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} cota{num !== 1 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Valor por cota:</span>
                        <span>{formatCurrency(pool.contributionAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Quantidade:</span>
                        <span>{shares} cota{shares !== 1 ? 's' : ''}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total a pagar:</span>
                        <span className="text-lg text-green-600">{formatCurrency(totalCost)}</span>
                      </div>
                    </div>

                    <Button onClick={handleNextStep} className="w-full">
                      Continuar
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Etapa 2: Dados do Participante */}
        {step === 'participant' && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Dados do Participante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    value={participantData.name}
                    onChange={(e) => setParticipantData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={participantData.email}
                    onChange={(e) => setParticipantData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={participantData.phone}
                    onChange={(e) => setParticipantData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Seus dados serão usados para identificação no bolão e para envio de atualizações sobre os resultados.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handlePrevStep} className="flex-1">
                Voltar
              </Button>
              <Button onClick={handleNextStep} disabled={!isFormValid} className="flex-1">
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Etapa 3: Pagamento */}
        {step === 'payment' && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Forma de pagamento</Label>
                  <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX (Instantâneo)</SelectItem>
                      <SelectItem value="credit">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit">Cartão de Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentMethod === 'pix' && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Você receberá um código QR para pagamento via PIX após a confirmação.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Resumo da compra</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Participante:</span>
                      <span>{participantData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cotas:</span>
                      <span>{shares} cota{shares !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bolão:</span>
                      <span>{pool.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sorteio:</span>
                      <span>{new Date(pool.drawDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span className="text-green-600">{formatCurrency(totalCost)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handlePrevStep} className="flex-1">
                Voltar
              </Button>
              <Button 
                onClick={handlePurchase} 
                disabled={loading}
                className="flex-1 gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Finalizar Compra
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Etapa 4: Sucesso */}
        {step === 'success' && (
          <div className="space-y-6 text-center">
            <div className="py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Compra realizada com sucesso!</h3>
              <p className="text-muted-foreground">
                Você agora participa do bolão "{pool.name}" com {shares} cota{shares !== 1 ? 's' : ''}.
              </p>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Participante:</span>
                    <span className="font-medium">{participantData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cotas:</span>
                    <span className="font-medium">{shares}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor pago:</span>
                    <span className="font-medium text-green-600">{formatCurrency(totalCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant="default">Confirmado</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Um e-mail de confirmação foi enviado para {participantData.email}
              </p>
              <Button onClick={handleClose} className="w-full">
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}