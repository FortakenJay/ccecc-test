"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Toast, useToast } from "@/components/ui/toast";
import {useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const { toast, showToast, hideToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("login");

  async function handleLogin() {
    // check if email and password are not empty
    if (!email || !password) {
      showToast(t("emptyFieldsError"), "error");
      return;
    }
      const { error } = await supabase.auth.signInWithPassword({email, password});
    if (error) {
      showToast(`${t("loginError")}: ${error.message}`, "error");
    } else {
      showToast(t("loginSuccess"), "success");
      router.push("/panel");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-[#8B0000] to-[#C8102E] pb-20">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              await handleLogin();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input 
                id="email" 
                type="email"
                placeholder={t("emailPlaceholder")} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder={t("passwordPlaceholder")} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <Button className="w-full cursor-pointer" type="submit">{t("loginButton")}</Button>
          </form>
        </CardContent>
      </Card>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={hideToast}
          position="top"
        />
      )}
    </div>
  );
}
