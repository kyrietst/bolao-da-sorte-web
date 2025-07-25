import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Receipt, 
  Download, 
  Printer, 
  Share2, 
  CheckCircle,
  Calendar,
  User,
  Trophy,
  Target,
  DollarSign,
  CreditCard,
  Mail,
  Phone
} from 'lucide-react';
import { Pool } from '@/types';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { toast } from 'sonner';

interface DigitalReceiptModalProps {
  pool: Pool;
  children: React.ReactNode;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export default function DigitalReceiptModal({ pool, children }: DigitalReceiptModalProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const handleDownload = () => {
    toast.success('Recibo baixado com sucesso!');
  };

  const handlePrint = () => {
    window.print();
    toast.success('Enviado para impressão!');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Recibo - ${pool.name}`,
        text: `Minha participação no bolão ${pool.name}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const receiptNumber = `${pool.id.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
  const currentDate = new Date().toLocaleDateString('pt-BR');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-500" />
            Recibo Digital
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header do Recibo */}
          <Card className="border-2">
            <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <CardTitle className="text-xl">Bolão da Sorte</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Comprovante de Participação em Bolão
              </p>
              <Badge variant="outline" className="mx-auto mt-2">
                Recibo: {receiptNumber}
              </Badge>
            </CardHeader>
          </Card>

          {/* Informações do Participante */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Dados do Participante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="font-medium">{user?.user_metadata?.name || 'Usuário'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">E-mail</p>
                  <p className="font-medium text-sm">{user?.email}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Data de Emissão</p>
                <p className="font-medium">{currentDate}</p>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Bolão */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Informações do Bolão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Nome do Bolão</p>
                  <p className="font-medium">{pool.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Modalidade</p>
                  <p className="font-medium">Mega-Sena</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data do Sorteio</p>
                  <p className="font-medium">{formatDate(pool.drawDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total de Volantes</p>
                  <p className="font-medium">{pool.numTickets} volantes</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Participação confirmada:</p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">1 cota de participação</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Você tem direito a uma parte proporcional dos prêmios conforme os acertos obtidos.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Resumo Financeiro */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Valor da cota:</span>
                  <span className="font-medium">{formatCurrency(pool.contributionAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Quantidade de cotas:</span>
                  <span className="font-medium">1 cota</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Taxa do organizador (10%):</span>
                  <span className="font-medium">{formatCurrency(pool.contributionAmount * 0.1)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-semibold">
                  <span>Total pago:</span>
                  <span className="text-green-600">{formatCurrency(pool.contributionAmount)}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Pagamento Confirmado
                  </span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Sua participação está garantida no bolão.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Termos e Condições */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Termos e Condições</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground space-y-2">
                <p>• Este recibo comprova sua participação no bolão especificado acima.</p>
                <p>• Os prêmios serão distribuídos proporcionalmente entre os participantes conforme os acertos.</p>
                <p>• O organizador é responsável pela compra dos bilhetes e distribuição dos prêmios.</p>
                <p>• Em caso de dúvidas, entre em contato com o organizador do bolão.</p>
                <p>• Este documento tem validade legal como comprovante de participação.</p>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDownload} className="flex-1 gap-2">
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
            <Button variant="outline" onClick={handlePrint} className="flex-1 gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={handleShare} className="flex-1 gap-2">
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Bolão da Sorte - Sistema de Gestão de Bolões
            </p>
            <p className="text-xs text-muted-foreground">
              Emitido em {currentDate} às {new Date().toLocaleTimeString('pt-BR')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}