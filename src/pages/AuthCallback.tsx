import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      // Garante que o Supabase processa o token do hash
      await supabase.auth.getSession();
      navigate("/dashboard", { replace: true });
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      A confirmar acesso…
    </div>
  );
};

export default AuthCallback;
