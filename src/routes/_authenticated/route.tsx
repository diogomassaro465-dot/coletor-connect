import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const { data: roles, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    const isAdmin = !!roles?.some((item) => item.role === "admin");
    const isConsultant = !!roles?.some(
      (item) => item.role === "consultor" || item.role === "atendente",
    );
    const isRecenseador = !!roles?.some((item) => item.role === "recenseador");
    const role = isAdmin
      ? "admin"
      : isConsultant
        ? "consultor"
        : isRecenseador
          ? "recenseador"
          : null;
    if (roleError || !role) {
      await supabase.auth.signOut();
      throw redirect({ to: "/auth" });
    }
    return { user: data.user, role, isAdmin, isConsultant, isRecenseador };
  },
  component: () => <Outlet />,
});
