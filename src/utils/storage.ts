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

  // Normalize path (strip leading slashes)
  const normalizedPath = String(path).replace(/^\/+/, '');

  if (bucket === 'avatars') {
    if (!userId || !normalizedPath.startsWith(`${userId}/`)) {
      throw new Error("Invalid avatar path");
    }
  } else {
    if (!companyId || !normalizedPath.startsWith(`${companyId}/`)) {
      throw new Error("Invalid company path");
    }
  }

  // Clamp expiration to match server constraints (10–300s)
  const safeExpires = Math.max(10, Math.min(300, expiresIn));

  const { data, error } = await supabase.functions.invoke("generate-signed-url", {
    body: { bucket, path: normalizedPath, company_id: companyId, expiresIn: safeExpires },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) throw new Error("Failed to get signed URL");
  return (data as { signedUrl: string }).signedUrl;
}