"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface NotificationToastContentProps {
  id: string;
  title: string;
  message: string;
  date: string;
  icon: React.ElementType;
  iconColorClass: string;
  link?: string;
  dismiss: () => void; // Função para fechar o toast
}

const NotificationToastContent: React.FC<NotificationToastContentProps> = ({
  id,
  title,
  message,
  date,
  icon: Icon,
  iconColorClass,
  link,
  dismiss,
}) => {
  return (
    <div className="flex items-start p-3 border rounded-md bg-card text-card-foreground shadow-lg w-full max-w-sm">
      <Icon className={`h-5 w-5 mr-3 mt-1 flex-shrink-0 ${iconColorClass}`} />
      <div className="flex-1">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">{message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {format(parseISO(date), "dd/MM/yyyy HH:mm", { locale: pt })}
        </p>
        {link && (
          <Button asChild variant="link" size="sm" className="h-auto p-0 mt-2 text-xs" onClick={dismiss}>
            <Link to={link}>Ver Detalhes</Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default NotificationToastContent;