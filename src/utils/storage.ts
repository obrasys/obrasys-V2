"use client";

import { supabase } from "@/integrations/supabase/client";

const ALLOWED_BUCKETS = new Set(['attachments', 'reports', 'avatars']);

export async function getSignedUrl(bucket: string, path: string, companyId: string, expiresIn: number = 60) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Unauthorized");

  if (!ALLOWED_BUCKETS.has(bucket)) {
    throw new Error("Bucket not allowed");
  }

  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes?.user?.id;

  if (bucket === 'avatars') {
    if (!userId || !String(path).startsWith(`${userId}/`)) {
      throw new Error("Invalid avatar path");
    }
  } else {
    if (!companyId || !String(path).startsWith(`${companyId}/`)) {
      throw new Error("Invalid company path");
    }
  }

  const { data, error } = await supabase.functions.invoke("generate-signed-url", {
    body: { bucket, path, company_id: companyId, expiresIn },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) throw new Error("Failed to get signed URL");
  return (data as { signedUrl: string }).signedUrl;
}