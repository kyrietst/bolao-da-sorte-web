import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Participant } from '@/types';

interface ParticipantsTableProps {
  participants: Participant[];
}

export default function ParticipantsTable({ participants }: ParticipantsTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500 hover:bg-green-600">Confirmado</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participantes</CardTitle>
      </CardHeader>
      <CardContent>
        {participants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Nome</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Cotas</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((participant) => (
                  <tr key={participant.id} className="border-b last:border-b-0">
                    <td className="py-3 px-2 font-medium">{participant.name}</td>
                    <td className="py-3 px-2 text-center">1</td>
                    <td className="py-3 px-2 text-right">
                      {getStatusBadge(participant.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nenhum participante cadastrado ainda</p>
            <p className="text-xs">Os participantes aparecerão aqui quando se inscreverem no bolão.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}