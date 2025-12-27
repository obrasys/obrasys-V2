"use client";

import { supabase } from "@/integrations/supabase/client";

export async function getSignedUrl(bucket: string, path: string, companyId: string, expiresIn: number = 60) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Unauthorized");

  const { data, error } = await supabase.functions.invoke("generate-signed-url", {
    body: { bucket, path, company_id: companyId, expiresIn },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) throw new Error("Failed to get signed URL");
  return (data as { signedUrl: string }).signedUrl;
}