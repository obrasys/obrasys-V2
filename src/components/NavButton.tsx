"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, ButtonProps } from "@/components/ui/button";

interface NavButtonProps extends ButtonProps {
  to: string;
  children: React.ReactNode;
}

const NavButton: React.FC<NavButtonProps> = ({ to, children, onClick, ...props }) => {
  const navigate = useNavigate();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (onClick) {
      onClick(event);
    }
    if (!event.defaultPrevented) { // Only navigate if onClick didn't prevent default
      navigate(to);
    }
  };

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  );
};

export default NavButton;