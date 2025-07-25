import { useState, useMemo } from 'react';
import MainLayout from '@/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ShoppingCart, 
  CreditCard, 
  Calendar,
  DollarSign,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Minus,
  Trash2,
  Calculator
} from 'lucide-react';
import { LotteryType } from '@/types';
import { LotteryNumbers } from '@/components/lottery/LotteryNumbers';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BetItem {
  id: string;
  lottery: LotteryType;
  numbers: number[];
  quantity: number;
  price: number;
  drawDate: string;
}

interface BetCart {
  items: BetItem[];
  total: number;
}

const lotteryNames: Record<LotteryType, string> = {
  megasena: 'Mega-Sena',
};

const lotteryConfigs = {
  megasena: { min: 1, max: 60, picks: 6, price: 5.00, drawDays: ['Terças', 'Quintas', 'Sábados'] },
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value);
};

const generateRandomNumbers = (min: number, max: number, count: number): number[] => {
  const numbers = [];
  while (numbers.length < count) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }
  return numbers.sort((a, b) => a - b);
};

// Mock de próximos sorteios
const getNextDrawDate = (lottery: LotteryType): string => {
  const today = new Date();
  const nextDraw = new Date(today);
  nextDraw.setDate(today.getDate() + Math.floor(Math.random() * 7) + 1);
  return nextDraw.toISOString().split('T')[0];
};

export default function Betting() {
  const [selectedLottery, setSelectedLottery] = useState<LotteryType>('megasena');
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [cart, setCart] = useState<BetCart>({ items: [], total: 0 });
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit' | 'debit'>('pix');

  const lotteryConfig = lotteryConfigs[selectedLottery];
  const nextDrawDate = useMemo(() => getNextDrawDate(selectedLottery), [selectedLottery]);

  const handleNumberSelect = (number: number) => {
    if (selectedNumbers.includes(number)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== number));
    } else if (selectedNumbers.length < 15) { // Limite máximo para todas as loterias
      setSelectedNumbers([...selectedNumbers, number].sort((a, b) => a - b));
    }
  };

  const generateRandomGame = () => {
    const numbers = generateRandomNumbers(lotteryConfig.min, lotteryConfig.max, lotteryConfig.picks);
    setSelectedNumbers(numbers);
  };

  const clearSelection = () => {
    setSelectedNumbers([]);
  };

  const addToCart = () => {
    if (selectedNumbers.length < lotteryConfig.picks) {
      toast.error(`Selecione pelo menos ${lotteryConfig.picks} números`);
      return;
    }

    // Calcular preço baseado na quantidade de números selecionados
    const numbersCount = selectedNumbers.length;
    const combinations = Math.max(1, Math.floor(Math.pow(numbersCount, 2) / lotteryConfig.picks));
    const itemPrice = lotteryConfig.price * combinations * quantity;

    const newItem: BetItem = {
      id: `${Date.now()}-${Math.random()}`,
      lottery: selectedLottery,
      numbers: [...selectedNumbers],
      quantity,
      price: itemPrice,
      drawDate: nextDrawDate
    };

    setCart(prev => {
      const newItems = [...prev.items, newItem];
      const newTotal = newItems.reduce((sum, item) => sum + item.price, 0);
      return { items: newItems, total: newTotal };
    });

    setSelectedNumbers([]);
    setQuantity(1);
    toast.success('Jogo adicionado ao carrinho!');
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newItems = prev.items.filter(item => item.id !== itemId);
      const newTotal = newItems.reduce((sum, item) => sum + item.price, 0);
      return { items: newItems, total: newTotal };
    });
    toast.success('Item removido do carrinho');
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setCart(prev => {
      const newItems = prev.items.map(item => {
        if (item.id === itemId) {
          const basePrice = item.price / item.quantity;
          return { ...item, quantity: newQuantity, price: basePrice * newQuantity };
        }
        return item;
      });
      const newTotal = newItems.reduce((sum, item) => sum + item.price, 0);
      return { items: newItems, total: newTotal };
    });
  };

  const processPayment = () => {
    if (cart.items.length === 0) {
      toast.error('Adicione jogos ao carrinho antes de finalizar');
      return;
    }

    // Simular processamento de pagamento
    toast.success('Pagamento processado com sucesso! Boa sorte!');
    setCart({ items: [], total: 0 });
  };

  const canAddToCart = selectedNumbers.length >= lotteryConfig.picks;
  const numbersNeeded = Math.max(0, lotteryConfig.picks - selectedNumbers.length);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fazer Apostas</h1>
          <p className="text-muted-foreground">
            Escolha seus números e participe dos próximos sorteios
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Seleção de Jogos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Seleção de Loteria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Escolha sua Loteria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Modalidade</Label>
                    <Select 
                      value={selectedLottery} 
                      onValueChange={(value) => {
                        setSelectedLottery(value as LotteryType);
                        setSelectedNumbers([]);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(lotteryNames).map(([key, name]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center justify-between w-full">
                              <span>{name}</span>
                              <span className="text-sm text-muted-foreground ml-4">
                                {formatCurrency(lotteryConfigs[key as LotteryType].price)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantidade de jogos</Label>
                    <Select 
                      value={quantity.toString()} 
                      onValueChange={(value) => setQuantity(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 5, 10].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? 'jogo' : 'jogos'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground">Escolha</p>
                    <p className="font-semibold">{lotteryConfig.picks} números</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground">Preço</p>
                    <p className="font-semibold">{formatCurrency(lotteryConfig.price)}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground">Próximo Sorteio</p>
                    <p className="font-semibold text-sm">
                      {new Date(nextDrawDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seleção de Números */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Escolha seus números</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={generateRandomGame}>
                      Surpresinha
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearSelection}>
                      Limpar
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    Escolha {lotteryConfig.picks} números de {lotteryConfig.min} a {lotteryConfig.max}
                  </p>
                  <Badge variant={canAddToCart ? "default" : "secondary"}>
                    {selectedNumbers.length}/{lotteryConfig.picks}
                    {numbersNeeded > 0 && ` (faltam ${numbersNeeded})`}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Números selecionados */}
                {selectedNumbers.length > 0 && (
                  <div className="mb-4">
                    <Label className="text-sm">Números selecionados:</Label>
                    <div className="mt-2">
                      <LotteryNumbers 
                        type={selectedLottery}
                        numbers={selectedNumbers}
                        size="sm"
                      />
                    </div>
                  </div>
                )}

                {/* Grid de números */}
                <div className="grid grid-cols-10 gap-1">
                  {Array.from({ length: lotteryConfig.max - lotteryConfig.min + 1 }, (_, i) => {
                    const number = lotteryConfig.min + i;
                    const isSelected = selectedNumbers.includes(number);
                    return (
                      <Button
                        key={number}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 text-xs",
                          isSelected && "bg-blue-500 hover:bg-blue-600"
                        )}
                        onClick={() => handleNumberSelect(number)}
                      >
                        {number.toString().padStart(2, '0')}
                      </Button>
                    );
                  })}
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {numbersNeeded > 0 
                      ? `Selecione mais ${numbersNeeded} número${numbersNeeded > 1 ? 's' : ''}`
                      : selectedNumbers.length > lotteryConfig.picks 
                        ? `${selectedNumbers.length - lotteryConfig.picks} número${selectedNumbers.length - lotteryConfig.picks > 1 ? 's' : ''} extra${selectedNumbers.length - lotteryConfig.picks > 1 ? 's' : ''} selecionado${selectedNumbers.length - lotteryConfig.picks > 1 ? 's' : ''}`
                        : 'Seleção completa!'
                    }
                  </div>
                  
                  <Button 
                    onClick={addToCart}
                    disabled={!canAddToCart}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar ao Carrinho
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Carrinho e Pagamento */}
          <div className="space-y-6">
            {/* Carrinho */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-green-500" />
                  Carrinho ({cart.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.items.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum jogo adicionado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.items.map((item) => (
                      <div key={item.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {lotteryNames[item.lottery]}
                            </Badge>
                            <span className="text-sm font-medium">
                              {formatCurrency(item.price)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <LotteryNumbers 
                          type={item.lottery}
                          numbers={item.numbers.slice(0, 8)}
                          size="xs"
                        />
                        {item.numbers.length > 8 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            +{item.numbers.length - 8} números
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-xs px-2">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Sorteio: {new Date(item.drawDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between font-semibold">
                      <span>Total:</span>
                      <span className="text-lg">{formatCurrency(cart.total)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagamento */}
            {cart.items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-purple-500" />
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
                        Pagamento instantâneo via PIX. Você receberá o código QR após confirmar.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Subtotal:</span>
                      <span>{formatCurrency(cart.total)}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Taxa de processamento:</span>
                      <span>{formatCurrency(0)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between font-semibold">
                      <span>Total a pagar:</span>
                      <span className="text-lg">{formatCurrency(cart.total)}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={processPayment}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <CreditCard className="h-4 w-4" />
                    Finalizar Pagamento
                  </Button>

                  <div className="text-xs text-muted-foreground text-center">
                    <p>Ao finalizar, você concorda com nossos termos de uso.</p>
                    <p>Jogue com responsabilidade. +18 anos.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Próximos Sorteios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {Object.entries(lotteryConfigs).map(([key, config]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span>{lotteryNames[key as LotteryType]}:</span>
                      <span className="text-muted-foreground">
                        {config.drawDays.join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}