import { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  children?: ReactNode; // Para ações como botões
}

export const EmptyState = ({ title, description, icon, children }: EmptyStateProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-10 text-center">
      {icon && (
        <div className="mb-4 flex justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1 mb-4">
        {description}
      </p>
      {children}
    </div>
  );
};
