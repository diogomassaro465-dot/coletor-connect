/**
 * Mascaramento de dados sensíveis (LGPD).
 *
 * Apenas perfis com permissão específica (Administrador UCIP) podem visualizar
 * dados sensíveis completos. Demais perfis recebem versões parcialmente
 * mascaradas, suficientes para identificação operacional sem expor PII.
 */

export function canViewSensitive(role?: string | null): boolean {
  // Apenas administradores enxergam dados sensíveis completos.
  return role === "admin";
}

export function maskCPF(value?: string | null): string {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return "***.***.***-**";
  return `***.${digits.slice(3, 6)}.***-**`;
}

export function maskRG(value?: string | null): string {
  if (!value) return "—";
  const v = value.trim();
  if (v.length <= 3) return "***";
  return `${"*".repeat(Math.max(v.length - 3, 3))}${v.slice(-3)}`;
}

export function maskPhone(value?: string | null): string {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  const ddd = digits.length >= 10 ? `(${digits.slice(0, 2)}) ` : "";
  return `${ddd}****-${digits.slice(-4)}`;
}

export function maskEmail(value?: string | null): string {
  if (!value) return "—";
  const [user, domain] = value.split("@");
  if (!domain) return "***";
  const visible = user.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(user.length - 2, 2))}@${domain}`;
}

export function maskAddress(value?: string | null): string {
  if (!value) return "—";
  // Mantém apenas o bairro/cidade aproximado (último trecho separado por vírgula),
  // omite número e logradouro detalhados.
  const parts = value.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return "Endereço protegido";
  const tail = parts.slice(-2).join(", ");
  return `••• ${tail}`;
}

export function maskDocument(value?: string | null): string {
  if (!value) return "—";
  const v = value.trim();
  if (v.length <= 2) return "***";
  return `${"*".repeat(Math.max(v.length - 2, 3))}${v.slice(-2)}`;
}
