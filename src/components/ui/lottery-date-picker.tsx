import { useState, useEffect } from 'react';
import { Calendar, ChevronDown, AlertTriangle } from 'lucide-react';
import { LotteryType } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  isValidLotteryDate,
  getNextValidLotteryDate,
  getValidLotteryDatesInMonth,
  getLotteryScheduleDescription,
  LOTTERY_SCHEDULES
} from '@/utils/lotterySchedule';

interface LotteryDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  lotteryType: LotteryType;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export function LotteryDatePicker({
  value,
  onChange,
  lotteryType,
  label = 'Data do Sorteio',
  required = true,
  disabled = false
}: LotteryDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value);
  const [displayMonth, setDisplayMonth] = useState(new Date().getMonth() + 1);
  const [displayYear, setDisplayYear] = useState(new Date().getFullYear());

  const isDateValid = value ? isValidLotteryDate(lotteryType, value) : true;
  const schedule = LOTTERY_SCHEDULES[lotteryType];

  // Gerar datas válidas para o mês atual
  const validDatesInMonth = getValidLotteryDatesInMonth(lotteryType, displayYear, displayMonth);
  
  // Filtrar apenas datas futuras ou de hoje
  const today = new Date().toISOString().split('T')[0];
  const availableDates = validDatesInMonth.filter(date => date >= today);

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return 'Selecione uma data';
    
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      return date.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Data inválida';
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    onChange(date);
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'next') {
      if (displayMonth === 12) {
        setDisplayMonth(1);
        setDisplayYear(displayYear + 1);
      } else {
        setDisplayMonth(displayMonth + 1);
      }
    } else {
      if (displayMonth === 1) {
        setDisplayMonth(12);
        setDisplayYear(displayYear - 1);
      } else {
        setDisplayMonth(displayMonth - 1);
      }
    }
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    if (value && !isValidLotteryDate(lotteryType, value)) {
      // Sugerir a próxima data válida
      const nextValidDate = getNextValidLotteryDate(lotteryType, value);
      console.warn(`Data inválida para ${lotteryType}: ${value}. Sugestão: ${nextValidDate}`);
    }
  }, [value, lotteryType]);

  return (
    <div className="space-y-2">
      <Label htmlFor="lottery-date-picker">{label}</Label>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-between text-left font-normal ${
              !value ? 'text-muted-foreground' : ''
            } ${!isDateValid ? 'border-red-300 bg-red-50' : ''}`}
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDateForDisplay(value)}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4">
            {/* Header com navegação de mês */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                disabled={displayYear === new Date().getFullYear() && displayMonth <= new Date().getMonth() + 1}
              >
                ←
              </Button>
              <h3 className="font-semibold">
                {monthNames[displayMonth - 1]} {displayYear}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                →
              </Button>
            </div>

            {/* Informação sobre os dias de sorteio */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {schedule.description}
              </p>
            </div>

            {/* Lista de datas disponíveis */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableDates.length > 0 ? (
                availableDates.map((date) => (
                  <Button
                    key={date}
                    variant={selectedDate === date ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => handleDateSelect(date)}
                  >
                    {formatDateForDisplay(date)}
                  </Button>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">Nenhuma data disponível neste mês</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                    className="mt-2"
                  >
                    Ver próximo mês
                  </Button>
                </div>
              )}
            </div>

            {/* Botão para hoje (se for um dia válido) */}
            {isValidLotteryDate(lotteryType, today) && (
              <div className="mt-4 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDateSelect(today)}
                >
                  Hoje - {formatDateForDisplay(today)}
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Aviso se a data não for válida */}
      {!isDateValid && value && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700 dark:text-red-300">
            <div className="space-y-1">
              <p className="font-medium">Data inválida para {schedule.name}</p>
              <p className="text-sm">{getLotteryScheduleDescription(lotteryType)}</p>
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-red-600 hover:text-red-800"
                onClick={() => {
                  const nextValid = getNextValidLotteryDate(lotteryType, value);
                  handleDateSelect(nextValid);
                }}
              >
                Corrigir para próxima data válida
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Campo oculto para compatibilidade com formulários */}
      <Input
        type="hidden"
        value={value}
        required={required}
        name="drawDate"
      />
    </div>
  );
}