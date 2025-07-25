import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Share2, 
  Copy, 
  Mail, 
  MessageCircle, 
  ExternalLink,
  Users,
  CheckCircle,
  Send,
  Loader2
} from 'lucide-react';
import { Pool } from '@/types';
import { toast } from 'sonner';

interface InviteFriendsModalProps {
  pool: Pool;
  children: React.ReactNode;
}

export default function InviteFriendsModal({ pool, children }: InviteFriendsModalProps) {
  const [open, setOpen] = useState(false);
  const [emails, setEmails] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const shareUrl = `${window.location.origin}/boloes/${pool.id}`;
  
  const defaultMessage = `Olá! 👋

Gostaria de te convidar para participar do meu bolão "${pool.name}"!

🎯 Modalidade: Mega-Sena
📅 Sorteio: ${new Date(pool.drawDate).toLocaleDateString('pt-BR')}
💰 Valor da cota: R$ ${pool.contributionAmount.toFixed(2)}
🎫 ${pool.numTickets} volantes com ${pool.numTickets * 10} jogos

Acesse o link abaixo para participar:
${shareUrl}

Vamos torcer juntos! 🍀`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copiado para a área de transferência!');
  };

  const handleShareWhatsApp = () => {
    const whatsappMessage = encodeURIComponent(defaultMessage);
    window.open(`https://wa.me/?text=${whatsappMessage}`, '_blank');
  };

  const handleSendEmails = async () => {
    if (!emails.trim()) {
      toast.error('Digite pelo menos um e-mail para enviar o convite.');
      return;
    }

    setSending(true);
    
    try {
      // Simular envio de e-mails
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const emailList = emails.split(',').map(email => email.trim()).filter(email => email);
      
      // Aqui seria feita a integração real com:
      // 1. API de envio de e-mails
      // 2. Template de convite
      // 3. Tracking de convites enviados
      
      toast.success(`${emailList.length} convite${emailList.length !== 1 ? 's' : ''} enviado${emailList.length !== 1 ? 's' : ''} com sucesso!`);
      setEmails('');
      setMessage('');
      
    } catch (error) {
      toast.error('Erro ao enviar convites. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Convite - ${pool.name}`,
        text: defaultMessage,
        url: shareUrl
      });
    } else {
      handleCopyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-500" />
            Convidar Amigos - {pool.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Bolão */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Resumo do Bolão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Modalidade</p>
                  <p className="font-medium">Mega-Sena</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data do Sorteio</p>
                  <p className="font-medium">{new Date(pool.drawDate).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor da Cota</p>
                  <p className="font-medium text-green-600">R$ {pool.contributionAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total de Volantes</p>
                  <p className="font-medium">{pool.numTickets} volantes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Link de Compartilhamento */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Link de Convite</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input 
                  value={shareUrl} 
                  readOnly 
                  className="flex-1 bg-muted"
                />
                <Button variant="outline" onClick={handleCopyLink} className="gap-2">
                  <Copy className="h-4 w-4" />
                  Copiar
                </Button>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleShareWhatsApp} 
                  className="flex-1 gap-2 bg-green-50 hover:bg-green-100 border-green-200"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleNativeShare} 
                  className="flex-1 gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Compartilhar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Convite por E-mail */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Enviar por E-mail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emails">E-mails dos amigos (separados por vírgula)</Label>
                <Textarea
                  id="emails"
                  placeholder="email1@exemplo.com, email2@exemplo.com, email3@exemplo.com"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Digite os e-mails separados por vírgula. Os convites serão enviados automaticamente.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem personalizada (opcional)</Label>
                <Textarea
                  id="message"
                  placeholder="Adicione uma mensagem pessoal ao convite..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleSendEmails} 
                disabled={sending || !emails.trim()}
                className="w-full gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar Convites
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Prévia da Mensagem */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Prévia do Convite</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <pre className="whitespace-pre-wrap font-sans">
                  {message || defaultMessage}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Dicas */}
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Dicas para aumentar a participação:
                  </p>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Explique como funciona o bolão e os benefícios</li>
                    <li>• Mencione a data limite para participação</li>
                    <li>• Destaque o número de volantes e chances de ganhar</li>
                    <li>• Compartilhe em grupos familiares e de amigos</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}