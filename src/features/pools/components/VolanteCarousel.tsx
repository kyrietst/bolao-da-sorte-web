import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Grid, TicketIcon, TrendingUp, Heart } from 'lucide-react';
import { Ticket } from '@/types';
import { cn } from '@/lib/utils';
import { useFavoriteTickets } from '@/features/pools/hooks/useFavoriteTickets';

interface Jogo {
  numero: number;
  numbers: number[];
}

interface Volante {
  numero: string;
  jogos: Jogo[];
  ticketId: string;
}

interface VolanteCarouselProps {
  tickets: Ticket[];
}

export default function VolanteCarousel({ tickets }: VolanteCarouselProps) {
  const [viewMode, setViewMode] = useState<'carousel' | 'grid' | 'compact'>('carousel');
  const [expandedVolantes, setExpandedVolantes] = useState<Set<string>>(new Set());
  const { isFavorite, toggleFavorite, isToggling } = useFavoriteTickets();

  // Converter tickets em volantes
  const volantes: Volante[] = tickets.map(ticket => {
    const jogos: Jogo[] = [];
    const numbersPerJogo = 6;
    const jogosPerVolante = 10;
    
    for (let i = 0; i < jogosPerVolante && (i * numbersPerJogo) < ticket.numbers.length; i++) {
      const startIndex = i * numbersPerJogo;
      const endIndex = startIndex + numbersPerJogo;
      const gameNumbers = ticket.numbers.slice(startIndex, endIndex);
      
      if (gameNumbers.length === numbersPerJogo) {
        jogos.push({
          numero: i + 1,
          numbers: gameNumbers.sort((a, b) => a - b)
        });
      }
    }
    
    return {
      numero: ticket.ticketNumber,
      jogos,
      ticketId: ticket.id
    };
  });

  const toggleExpanded = (volanteNumero: string) => {
    const newExpanded = new Set(expandedVolantes);
    if (newExpanded.has(volanteNumero)) {
      newExpanded.delete(volanteNumero);
    } else {
      newExpanded.add(volanteNumero);
    }
    setExpandedVolantes(newExpanded);
  };

  // Componente individual do volante
  const VolanteCard = ({ volante, showAllJogos = false }: { volante: Volante; showAllJogos?: boolean }) => {
    const isExpanded = expandedVolantes.has(volante.numero);
    const jogosToShow = showAllJogos || isExpanded ? volante.jogos : volante.jogos.slice(0, 3);

    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TicketIcon className="h-5 w-5 text-blue-500" />
              Volante {volante.numero}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => toggleFavorite(volante.ticketId)}
                disabled={isToggling}
              >
                <Heart 
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isFavorite(volante.ticketId) 
                      ? "fill-red-500 text-red-500" 
                      : "text-muted-foreground hover:text-red-500"
                  )}
                />
              </Button>
              <Badge variant="outline" className="flex items-center gap-1">
                <Grid className="h-3 w-3" />
                {volante.jogos.length} jogos
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Preview dos primeiros jogos */}
          <div className="space-y-2">
            {jogosToShow.map((jogo) => (
              <div key={jogo.numero} className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded text-xs font-medium">
                  {jogo.numero.toString().padStart(2, '0')}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {jogo.numbers.map((number, index) => (
                    <Badge 
                      key={index}
                      variant="secondary"
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    >
                      {number.toString().padStart(2, '0')}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Botão para expandir/recolher (apenas no modo compact/grid) */}
          {!showAllJogos && volante.jogos.length > 3 && (
            <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(volante.numero)}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full gap-2">
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Mostrar menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Ver mais {volante.jogos.length - 3} jogos
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {volante.jogos.slice(3).map((jogo) => (
                  <div key={jogo.numero} className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded text-xs font-medium">
                      {jogo.numero.toString().padStart(2, '0')}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {jogo.numbers.map((number, index) => (
                        <Badge 
                          key={index}
                          variant="secondary"
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                        >
                          {number.toString().padStart(2, '0')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Estatísticas do volante */}
          <div className="pt-3 border-t">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-2 bg-muted/50 rounded">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-semibold">{volante.jogos.length * 6} números</p>
              </div>
              <div className="p-2 bg-muted/50 rounded">
                <p className="text-xs text-muted-foreground">Cobertura</p>
                <p className="text-sm font-semibold flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {Math.round((volante.jogos.length / 10) * 100)}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (volantes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <TicketIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum volante cadastrado</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Os volantes aparecerão aqui quando forem adicionados ao bolão. Cada volante pode conter até 10 jogos.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controles de visualização */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Volantes do Bolão</h3>
          <p className="text-sm text-muted-foreground">
            {volantes.length} {volantes.length === 1 ? 'volante' : 'volantes'} • {volantes.reduce((acc, v) => acc + v.jogos.length, 0)} jogos total
          </p>
        </div>
        
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
          <TabsList>
            <TabsTrigger value="carousel">Carousel</TabsTrigger>
            <TabsTrigger value="grid">Grade</TabsTrigger>
            <TabsTrigger value="compact">Compacto</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conteúdo baseado no modo de visualização */}
      <Tabs value={viewMode} className="w-full">
        {/* Modo Carousel */}
        <TabsContent value="carousel" className="mt-0">
          <Carousel className="w-full" opts={{ align: "start", loop: true }}>
            <CarouselContent className="-ml-2 md:-ml-4">
              {volantes.map((volante) => (
                <CarouselItem key={volante.numero} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <VolanteCard volante={volante} showAllJogos />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </TabsContent>

        {/* Modo Grade */}
        <TabsContent value="grid" className="mt-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {volantes.map((volante) => (
              <VolanteCard key={volante.numero} volante={volante} />
            ))}
          </div>
        </TabsContent>

        {/* Modo Compacto */}
        <TabsContent value="compact" className="mt-0">
          <div className="space-y-3">
            {volantes.map((volante) => (
              <Card key={volante.numero} className="w-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TicketIcon className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold">Volante {volante.numero}</span>
                      <Badge variant="secondary" className="text-xs">
                        {volante.jogos.length} jogos
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleFavorite(volante.ticketId)}
                        disabled={isToggling}
                      >
                        <Heart 
                          className={cn(
                            "h-4 w-4 transition-colors",
                            isFavorite(volante.ticketId) 
                              ? "fill-red-500 text-red-500" 
                              : "text-muted-foreground hover:text-red-500"
                          )}
                        />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleExpanded(volante.numero)}
                        className="gap-1"
                      >
                        {expandedVolantes.has(volante.numero) ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Recolher
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Expandir
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <Collapsible open={expandedVolantes.has(volante.numero)}>
                    {/* Preview sempre visível - primeiro jogo */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground w-12">Jogo 01</span>
                      <div className="flex gap-1">
                        {volante.jogos[0]?.numbers.map((number, index) => (
                          <Badge 
                            key={index}
                            variant="secondary"
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-blue-500 text-white"
                          >
                            {number.toString().padStart(2, '0')}
                          </Badge>
                        ))}
                      </div>
                      {volante.jogos.length > 1 && (
                        <span className="text-xs text-muted-foreground">
                          +{volante.jogos.length - 1} jogos
                        </span>
                      )}
                    </div>
                    
                    <CollapsibleContent className="space-y-2">
                      {volante.jogos.slice(1).map((jogo) => (
                        <div key={jogo.numero} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-12">
                            Jogo {jogo.numero.toString().padStart(2, '0')}
                          </span>
                          <div className="flex gap-1">
                            {jogo.numbers.map((number, index) => (
                              <Badge 
                                key={index}
                                variant="secondary"
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-blue-500 text-white"
                              >
                                {number.toString().padStart(2, '0')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}