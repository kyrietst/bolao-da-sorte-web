
import { ReactNode } from 'react';

type StatCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
};

export default function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl font-semibold text-card-foreground">{value}</p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="p-2 bg-secondary/20 rounded-md">
          {icon}
        </div>
      </div>
    </div>
  );
}
