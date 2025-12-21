"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom'; // Import Link for navigation

const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex flex-col items-center mb-6">
          <img src="/marca_nav_bar.png" alt="Obra Sys Logo" className="h-12 w-auto mb-4" />
          <h1 className="text-3xl font-bold text-center text-primary dark:text-primary-foreground">
            Entrar na Plataforma
          </h1>
          <p className="text-center text-muted-foreground text-sm">
            Aceda à sua conta Obra Sys
          </p>
        </div>
        <Auth
          supabaseClient={supabase}
          providers={[]} // Only email/password by default
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                  inputBackground: 'hsl(var(--input))',
                  inputBorder: 'hsl(var(--border))',
                  inputBorderHover: 'hsl(var(--ring))',
                  inputBorderFocus: 'hsl(var(--ring))',
                  inputText: 'hsl(var(--foreground))',
                  defaultButtonBackground: 'hsl(var(--primary))',
                  defaultButtonBackgroundHover: 'hsl(var(--primary-foreground))',
                  defaultButtonBorder: 'hsl(var(--primary))',
                  defaultButtonText: 'hsl(var(--primary-foreground))',
                },
              },
            },
          }}
          theme="light" // Using light theme, can be dynamic later
          redirectTo={window.location.origin + '/dashboard'}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Palavra-passe',
                email_input_placeholder: 'email@exemplo.com',
                password_input_placeholder: '••••••••',
                button_label: 'Entrar',
                social_provider_text: 'Ou continue com',
                link_text: 'Já tem uma conta? Entrar',
              },
              sign_up: { // This will be used if Auth component is configured for sign_up view
                email_label: 'Email',
                password_label: 'Palavra-passe',
                email_input_placeholder: 'O seu email',
                password_input_placeholder: 'A sua palavra-passe',
                button_label: 'Registar',
                social_provider_text: 'Ou continue com',
                link_text: 'Não tem uma conta? Registar',
              },
              forgotten_password: {
                email_label: 'Email',
                password_label: 'Palavra-passe',
                email_input_placeholder: 'O seu email',
                button_label: 'Enviar instruções de recuperação',
                link_text: 'Esqueceu a sua palavra-passe?',
              },
              update_password: {
                password_label: 'Nova palavra-passe',
                password_input_placeholder: 'A sua nova palavra-passe',
                button_label: 'Atualizar palavra-passe',
              },
            },
          }}
        />
        <div className="flex flex-col items-center space-y-2 mt-4">
          <Link to="/signup" className="text-sm text-primary hover:underline">
            Criar conta
          </Link>
          <Link to="/login" className="text-sm text-muted-foreground hover:underline">
            Esqueci a palavra-passe
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;