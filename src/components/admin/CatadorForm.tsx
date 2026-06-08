import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Recycle, Camera, Upload, Check, X } from "lucide-react";
import {
  GENERO_OPTIONS, RACA_OPTIONS, ESCOLARIDADE_OPTIONS, MATERIAIS_OPTIONS,
  NIVEL_GOV_BR_OPTIONS, isValidCPF, maskCPF, maskPhone,
} from "@/lib/catador-constants";

type DocKey =
  | "comprovante_residencia_url"
  | "cpf_foto_url"
  | "rg_cin_foto_url"
  | "titulo_eleitor_foto_url"
  | "ctps_foto_url"
  | "nis_foto_url";

const schema = z.object({
  nome_cooperativa: z.string().trim().max(150).optional().or(z.literal("")),
  nome_completo: z.string().trim().min(2, "Nome obrigatório").max(150),
  genero: z.enum(["feminino", "masculino", "lgbtqia", "nao_responder"]),
  autodeclaracao_racial: z.string().min(1, "Obrigatório"),
  escolaridade: z.string().min(1, "Obrigatório"),
  email: z.string().trim().email("E-mail inválido").max(150).optional().or(z.literal("")),
  telefone: z.string().trim().max(20).optional().or(z.literal("")),
  endereco_completo: z.string().trim().min(5, "Endereço obrigatório").max(500),
  cpf: z.string().refine(isValidCPF, "CPF inválido"),
  rg_cin: z.string().trim().min(3, "Obrigatório").max(30),
  titulo_eleitor: z.string().trim().max(30).optional().or(z.literal("")),
  ctps: z.string().trim().max(30).optional().or(z.literal("")),
  nis: z.string().trim().max(30).optional().or(z.literal("")),
  renda_media_mensal: z.coerce.number().min(0, "Valor inválido"),
  contribui_inss: z.boolean(),
  inscrito_cadunico: z.boolean(),
  possui_bolsa_familia: z.boolean(),
  conta_bancaria_digital: z.string().trim().max(100).optional().or(z.literal("")),
  cadastro_gov_br: z.boolean(),
  nivel_cadastro_gov_br: z.string().optional().or(z.literal("")),
  materiais_coletados: z.array(z.string()).min(1, "Selecione pelo menos um material"),
  possui_carroca: z.boolean(),
  tipo_carroca: z.string().optional().or(z.literal("")),
  area_atuacao: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CatadorFormData = z.infer<typeof schema>;

export function CatadorForm({
  defaultValues,
  catadorId,
  mode = "create",
}: {
  defaultValues?: Partial<CatadorFormData> & Partial<Record<DocKey, string | null>>;
  catadorId?: string;
  mode?: "create" | "edit";
}) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [urls, setUrls] = useState<Record<DocKey, string | null>>({
    comprovante_residencia_url: defaultValues?.comprovante_residencia_url ?? null,
    cpf_foto_url: defaultValues?.cpf_foto_url ?? null,
    rg_cin_foto_url: defaultValues?.rg_cin_foto_url ?? null,
    titulo_eleitor_foto_url: defaultValues?.titulo_eleitor_foto_url ?? null,
    ctps_foto_url: defaultValues?.ctps_foto_url ?? null,
    nis_foto_url: defaultValues?.nis_foto_url ?? null,
  });
  const [naoTem, setNaoTem] = useState({
    email: false, telefone: false, comprovante_residencia: false,
    cpf_foto: false, rg_foto: false, titulo_foto: false,
    ctps_foto: false, nis_foto: false,
  });

  const form = useForm<CatadorFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome_cooperativa: "",
      nome_completo: "",
      genero: "nao_responder",
      autodeclaracao_racial: "",
      escolaridade: "",
      email: "",
      telefone: "",
      endereco_completo: "",
      cpf: "",
      rg_cin: "",
      titulo_eleitor: "",
      ctps: "",
      nis: "",
      renda_media_mensal: 0,
      contribui_inss: false,
      inscrito_cadunico: false,
      possui_bolsa_familia: false,
      conta_bancaria_digital: "",
      cadastro_gov_br: false,
      nivel_cadastro_gov_br: "",
      materiais_coletados: [],
      possui_carroca: false,
      tipo_carroca: "",
      area_atuacao: "",
      ...defaultValues,
    },
  });

  async function onSubmit(values: CatadorFormData) {
    setSubmitting(true);
    const payload = {
      ...values,
      email: naoTem.email ? null : values.email || null,
      telefone: naoTem.telefone ? null : values.telefone || null,
      nome_cooperativa: values.nome_cooperativa || null,
      titulo_eleitor: values.titulo_eleitor || null,
      ctps: values.ctps || null,
      nis: values.nis || null,
      conta_bancaria_digital: values.conta_bancaria_digital || null,
      nivel_cadastro_gov_br: values.cadastro_gov_br ? values.nivel_cadastro_gov_br || null : null,
      tipo_carroca: values.possui_carroca ? values.tipo_carroca || null : null,
      area_atuacao: values.area_atuacao || null,
      comprovante_residencia_url: naoTem.comprovante_residencia ? null : urls.comprovante_residencia_url,
      cpf_foto_url: naoTem.cpf_foto ? null : urls.cpf_foto_url,
      rg_cin_foto_url: naoTem.rg_foto ? null : urls.rg_cin_foto_url,
      titulo_eleitor_foto_url: naoTem.titulo_foto ? null : urls.titulo_eleitor_foto_url,
      ctps_foto_url: naoTem.ctps_foto ? null : urls.ctps_foto_url,
      nis_foto_url: naoTem.nis_foto ? null : urls.nis_foto_url,
    };

    const { error } =
      mode === "edit" && catadorId
        ? await supabase.from("catadores").update(payload).eq("id", catadorId)
        : await supabase.from("catadores").insert(payload);

    setSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        toast.error("CPF já cadastrado", { description: "Esse CPF já existe no sistema." });
      } else {
        toast.error("Erro ao salvar", { description: error.message });
      }
      return;
    }
    toast.success(mode === "edit" ? "Cadastro atualizado!" : "Catador cadastrado com sucesso!");
    navigate({ to: "/admin" });
  }

  const v = form.watch();
  const e = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-3xl mx-auto">
      {/* Cabeçalho estilo formulário oficial */}
      <div className="bg-card border border-border rounded-t-2xl px-6 md:px-10 py-8 text-center">
        <div className="inline-flex items-center gap-2 text-primary mb-3">
          <div className="size-10 rounded-full bg-primary-soft grid place-items-center">
            <Recycle className="size-5" />
          </div>
          <span className="font-bold text-sm tracking-wide">PROCATE · Projeto Catador Empreendedor</span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold leading-snug">
          CIDADANIA NA ECONOMIA CIRCULAR<br />
          <span className="text-primary">SEGMENTO DA RECICLAGEM</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-xl mx-auto">
          Anamnese socioeconômica para regularização/validação documental e cadastral
          de integrantes de grupos de Catadores(as).
        </p>
      </div>

      <div className="bg-card border-x border-b border-border rounded-b-2xl px-6 md:px-10 py-8 shadow-card space-y-7">
        {/* Cooperativa */}
        <Linha label="Nome da Cooperativa/Associação/Grupo:">
          <Input {...form.register("nome_cooperativa")} placeholder="(opcional)" />
        </Linha>

        <Item n={1} label="Nome completo do(a) Catador(a):" error={e.nome_completo?.message}>
          <Input {...form.register("nome_completo")} />
        </Item>

        <Item n={2} label="Gênero:" error={e.genero?.message}>
          <RadioGroup
            value={v.genero}
            onValueChange={(val) => form.setValue("genero", val as CatadorFormData["genero"])}
            className="flex flex-wrap gap-x-6 gap-y-2"
          >
            {GENERO_OPTIONS.map((o) => (
              <label key={o.value} className="flex items-center gap-2 cursor-pointer text-sm">
                <RadioGroupItem value={o.value} />
                <span>{o.label}</span>
              </label>
            ))}
          </RadioGroup>
        </Item>

        <Item n={3} label="Autodeclaração racial:" error={e.autodeclaracao_racial?.message}>
          <Select value={v.autodeclaracao_racial} onValueChange={(val) => form.setValue("autodeclaracao_racial", val)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {RACA_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </Item>

        <Item n={4} label="Escolaridade:" error={e.escolaridade?.message}>
          <Select value={v.escolaridade} onValueChange={(val) => form.setValue("escolaridade", val)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {ESCOLARIDADE_OPTIONS.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
            </SelectContent>
          </Select>
        </Item>

        <Item n={5} label="E-mail:" error={e.email?.message}>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Input
              type="email"
              {...form.register("email")}
              disabled={naoTem.email}
              className="flex-1"
            />
            <NaoTem checked={naoTem.email} onChange={(c) => setNaoTem((s) => ({ ...s, email: c }))} />
          </div>
        </Item>

        <Item n={6} label="Número Telefone:">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Input
              value={v.telefone ?? ""}
              disabled={naoTem.telefone}
              onChange={(ev) => form.setValue("telefone", maskPhone(ev.target.value))}
              placeholder="(00) 00000-0000"
              className="flex-1"
            />
            <NaoTem checked={naoTem.telefone} onChange={(c) => setNaoTem((s) => ({ ...s, telefone: c }))} />
          </div>
        </Item>

        <Item
          n={7}
          label="Endereço residencial completo (logradouro, número, complemento, bairro, município):"
          error={e.endereco_completo?.message}
        >
          <Textarea {...form.register("endereco_completo")} rows={3} />
          <Anexo
            label="Foto de comprovante de residência"
            fieldKey="comprovante_residencia_url"
            url={urls.comprovante_residencia_url}
            onUpload={(u) => setUrls((s) => ({ ...s, comprovante_residencia_url: u }))}
            checked={naoTem.comprovante_residencia}
            onChange={(c) => setNaoTem((s) => ({ ...s, comprovante_residencia: c }))}
          />
        </Item>

        <Item n={8} label="CPF:" error={e.cpf?.message}>
          <Input
            value={v.cpf}
            onChange={(ev) => form.setValue("cpf", maskCPF(ev.target.value), { shouldValidate: true })}
            placeholder="000.000.000-00"
          />
          <Anexo
            label="Foto do CPF (frente e verso)"
            fieldKey="cpf_foto_url"
            url={urls.cpf_foto_url}
            onUpload={(u) => setUrls((s) => ({ ...s, cpf_foto_url: u }))}
            checked={naoTem.cpf_foto}
            onChange={(c) => setNaoTem((s) => ({ ...s, cpf_foto: c }))}
          />
        </Item>

        <Item n={9} label="RG / CIN:" error={e.rg_cin?.message}>
          <Input {...form.register("rg_cin")} />
          <Anexo
            label="Foto do RG / CIN (frente e verso)"
            fieldKey="rg_cin_foto_url"
            url={urls.rg_cin_foto_url}
            onUpload={(u) => setUrls((s) => ({ ...s, rg_cin_foto_url: u }))}
            checked={naoTem.rg_foto}
            onChange={(c) => setNaoTem((s) => ({ ...s, rg_foto: c }))}
          />
        </Item>

        <Item n={10} label="Título de Eleitor:">
          <Input {...form.register("titulo_eleitor")} />
          <Anexo
            label="Foto do Título de Eleitor"
            fieldKey="titulo_eleitor_foto_url"
            url={urls.titulo_eleitor_foto_url}
            onUpload={(u) => setUrls((s) => ({ ...s, titulo_eleitor_foto_url: u }))}
            checked={naoTem.titulo_foto}
            onChange={(c) => setNaoTem((s) => ({ ...s, titulo_foto: c }))}
          />
        </Item>

        <Item n={11} label="CTPS:">
          <Input {...form.register("ctps")} />
          <Anexo
            label="Foto da CTPS"
            fieldKey="ctps_foto_url"
            url={urls.ctps_foto_url}
            onUpload={(u) => setUrls((s) => ({ ...s, ctps_foto_url: u }))}
            checked={naoTem.ctps_foto}
            onChange={(c) => setNaoTem((s) => ({ ...s, ctps_foto: c }))}
          />
        </Item>

        <Item n={12} label="NIS:">
          <Input {...form.register("nis")} />
          <Anexo
            label="Foto do NIS"
            fieldKey="nis_foto_url"
            url={urls.nis_foto_url}
            onUpload={(u) => setUrls((s) => ({ ...s, nis_foto_url: u }))}
            checked={naoTem.nis_foto}
            onChange={(c) => setNaoTem((s) => ({ ...s, nis_foto: c }))}
          />
        </Item>


        <Item n={13} label="Qual a renda média mensal?" error={e.renda_media_mensal?.message}>
          <Input type="number" step="0.01" min="0" {...form.register("renda_media_mensal")} placeholder="R$" />
        </Item>

        <SimNao n={14} label="Contribui com o INSS?" value={v.contribui_inss}
          onChange={(b) => form.setValue("contribui_inss", b)} />
        <SimNao n={15} label="Inscrito(a) no CadÚnico?" value={v.inscrito_cadunico}
          onChange={(b) => form.setValue("inscrito_cadunico", b)} />
        <SimNao n={16} label="Possui Bolsa Família?" value={v.possui_bolsa_familia}
          onChange={(b) => form.setValue("possui_bolsa_familia", b)} />

        <Item n={17} label="Conta bancária digital (App Caixa Tem):">
          <Input {...form.register("conta_bancaria_digital")} placeholder="(opcional)" />
        </Item>

        <SimNao n={18} label="Cadastro no gov.br?" value={v.cadastro_gov_br}
          onChange={(b) => form.setValue("cadastro_gov_br", b)} />

        {v.cadastro_gov_br && (
          <Item n={19} label="Se tem cadastro no gov.br, qual Nível:">
            <RadioGroup
              value={v.nivel_cadastro_gov_br ?? ""}
              onValueChange={(val) => form.setValue("nivel_cadastro_gov_br", val)}
              className="flex flex-wrap gap-x-6 gap-y-2"
            >
              {NIVEL_GOV_BR_OPTIONS.map((n) => (
                <label key={n} className="flex items-center gap-2 cursor-pointer text-sm">
                  <RadioGroupItem value={n} />
                  <span>{n}</span>
                </label>
              ))}
            </RadioGroup>
          </Item>
        )}

        {/* Bloco complementar: coleta */}
        <div className="pt-6 mt-2 border-t border-border">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">
            Informações complementares de coleta
          </h2>

          <Item n={20} label="Materiais coletados:" error={e.materiais_coletados?.message}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MATERIAIS_OPTIONS.map((m) => {
                const checked = v.materiais_coletados.includes(m);
                return (
                  <label key={m} className="flex items-center gap-2 border border-border rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(c) => {
                        const set = new Set(v.materiais_coletados);
                        if (c) set.add(m); else set.delete(m);
                        form.setValue("materiais_coletados", Array.from(set), { shouldValidate: true });
                      }}
                    />
                    <span>{m}</span>
                  </label>
                );
              })}
            </div>
          </Item>

          <SimNao n={21} label="Possui carroça?" value={v.possui_carroca}
            onChange={(b) => form.setValue("possui_carroca", b)} />

          {v.possui_carroca && (
            <Item n={22} label="Tipo de carroça:">
              <RadioGroup value={v.tipo_carroca ?? ""} onValueChange={(val) => form.setValue("tipo_carroca", val)} className="flex gap-6">
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="Manual" /> Manual</label>
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="Motorizada" /> Motorizada</label>
              </RadioGroup>
            </Item>
          )}

          <Item n={23} label="Área de atuação:">
            <Textarea {...form.register("area_atuacao")} rows={2} placeholder="Bairros, regiões, pontos de coleta..." />
          </Item>
        </div>

        <div className="pt-6 border-t border-border flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => navigate({ to: "/admin" })}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting} size="lg">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {mode === "edit" ? "Salvar alterações" : "Finalizar cadastro"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Item({
  n, label, error, children,
}: { n: number; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="flex gap-2 text-sm font-semibold text-foreground leading-snug">
        <span className="text-primary font-bold shrink-0">{n}.</span>
        <span>{label}</span>
      </label>
      <div className="pl-6">{children}</div>
      {error && <p className="text-xs text-destructive pl-6">{error}</p>}
    </div>
  );
}

function Linha({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 pb-2 border-b border-dashed border-border">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}

function SimNao({
  n, label, value, onChange,
}: { n: number; label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="space-y-2">
      <label className="flex flex-wrap items-center gap-4 text-sm font-semibold">
        <span className="flex gap-2">
          <span className="text-primary font-bold">{n}.</span>
          <span>{label}</span>
        </span>
        <div className="flex gap-4 pl-6 sm:pl-0">
          <label className="flex items-center gap-2 cursor-pointer font-normal">
            <input type="radio" checked={value === true} onChange={() => onChange(true)} className="accent-primary" />
            <span>SIM</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-normal">
            <input type="radio" checked={value === false} onChange={() => onChange(false)} className="accent-primary" />
            <span>NÃO</span>
          </label>
        </div>
      </label>
    </div>
  );
}

function Anexo({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2 border border-border">
      <span>📎 {label}</span>
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox checked={checked} onCheckedChange={(c) => onChange(!!c)} />
        <span>não tem</span>
      </label>
    </div>
  );
}

function NaoTem({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
      <Checkbox checked={checked} onCheckedChange={(c) => onChange(!!c)} />
      <span>não tem</span>
    </label>
  );
}
