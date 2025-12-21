"use client";

import React from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfilePersonalTab from "@/components/profile/ProfilePersonalTab";
import ProfileCompanyTab from "@/components/profile/ProfileCompanyTab";
import { Separator } from "@/components/ui/separator";

const ProfilePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "personal";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="space-y-6">
      {/* Header da Página */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Perfil</h1>
          <p className="text-muted-foreground text-sm">
            Gerir informações pessoais e dados da empresa
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal">Perfil Pessoal</TabsTrigger>
              <TabsTrigger value="company">Dados da Empresa</TabsTrigger>
            </TabsList>
            <Separator className="my-4" />
            <TabsContent value="personal">
              <ProfilePersonalTab />
            </TabsContent>
            <TabsContent value="company">
              <ProfileCompanyTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;