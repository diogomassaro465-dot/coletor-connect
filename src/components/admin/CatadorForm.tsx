import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import {
  GENERO_OPTIONS, RACA_OPTIONS, ESCOLARIDADE_OPTIONS, MATERIAIS_OPTIONS,
  NIVEL_GOV_BR_OPTIONS, isValidCPF, maskCPF, maskPhone,
} from "@/lib/catador-constants";

const schema = z.object({
  // Step 1
  nome_completo: z.string().trim().min(2, "Nome obrigatório").max(150),
  nome_cooperativa: z.string().trim().max(150).optional().or(z.literal("")),
  genero: z.enum(["feminino", "masculino", "lgbtqia", "nao_responder"]),
  autodeclaracao_racial: z.string().min(1, "Obrigatório"),
  escolaridade: z.string().min(1, "Obrigatório"),
  // Step 2
  email: z.string().trim().email("E-mail inválido").max(150).optional().or(z.literal("")),
  telefone: z.string().trim().max(20).optional().or(z.literal("")),
  endereco_completo: z.string().trim().min(5, "Endereço obrigatório").max(500),
  // Step 3
  cpf: z.string().refine(isValidCPF, "CPF inválido"),
  rg_cin: z.string().trim().min(3, "Obrigatório").max(30),
  titulo_eleitor: z.string().trim().max(30).optional().or(z.literal("")),
  ctps: z.string().trim().max(30).optional().or(z.literal("")),
  nis: z.string().trim().max(30).optional().or(z.literal("")),
  // Step 4
  renda_media_mensal: z.coerce.number().min(0, "Valor inválido"),
  contribui_inss: z.boolean(),
  inscrito_cadunico: z.boolean(),
  possui_bolsa_familia: z.boolean(),
  conta_bancaria_digital: z.string().trim().max(100).optional().or(z.literal("")),
  cadastro_gov_br: z.boolean(),
  nivel_cadastro_gov_br: z.string().optional().or(z.literal("")),
  // Step 5
  materiais_coletados: z.array(z.string()).min(1, "Selecione pelo menos um material"),
  possui_carroca: z.boolean(),
  tipo_carroca: z.string().optional().or(z.literal("")),
  area_atuacao: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CatadorFormData = z.infer<typeof schema>;

const STEPS = [
  { n: 1, title: "Identificação", desc: "Dados básicos" },
  { n: 2, title: "Contato", desc: "Endereço e contatos" },
  { n: 3, title: "Documentação", desc: "Documentos pessoais" },
  { n: 4, title: "Socioeconômico", desc: "Renda e programas sociais" },
  { n: 5, title: "Coleta", desc: "Materiais e atuação" },
  { n: 6, title: "Revisão", desc: "Confira e finalize" },
];

export function CatadorForm({
  defaultValues,
  catadorId,
  mode = "create",
}: {
  defaultValues?: Partial<CatadorFormData>;
  catadorId?: string;
  mode?: "create" | "edit";
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CatadorFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome_completo: "",
      nome_cooperativa: "",
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

  const stepFields: Record<number, (keyof CatadorFormData)[]> = {
    1: ["nome_completo", "nome_cooperativa", "genero", "autodeclaracao_racial", "escolaridade"],
    2: ["email", "telefone", "endereco_completo"],
    3: ["cpf", "rg_cin", "titulo_eleitor", "ctps", "nis"],
    4: ["renda_media_mensal", "contribui_inss", "inscrito_cadunico", "possui_bolsa_familia", "conta_bancaria_digital", "cadastro_gov_br", "nivel_cadastro_gov_br"],
    5: ["materiais_coletados", "possui_carroca", "tipo_carroca", "area_atuacao"],
  };

  async function nextStep() {
    const fields = stepFields[step];
    const ok = await form.trigger(fields);
    if (!ok) return;
    setStep((s) => Math.min(6, s + 1));
  }

  async function onSubmit(values: CatadorFormData) {
    setSubmitting(true);
    const payload = {
      ...values,
      email: values.email || null,
      telefone: values.telefone || null,
      nome_cooperativa: values.nome_cooperativa || null,
      titulo_eleitor: values.titulo_eleitor || null,
      ctps: values.ctps || null,
      nis: values.nis || null,
      conta_bancaria_digital: values.conta_bancaria_digital || null,
      nivel_cadastro_gov_br: values.cadastro_gov_br ? values.nivel_cadastro_gov_br || null : null,
      tipo_carroca: values.possui_carroca ? values.tipo_carroca || null : null,
      area_atuacao: values.area_atuacao || null,
    };

    const { error } =
      mode === "edit" && catadorId
        ? await supabase.from("catadores").update(payload).eq("id", catadorId)
        : await supabase.from("catadores").insert(payload);

    setSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        toast.error("CPF já cadastrado", { description: "Esse CPF já existe no sistema." });
        setStep(3);
      } else {
        toast.error("Erro ao salvar", { description: error.message });
      }
      return;
    }
    toast.success(mode === "edit" ? "Cadastro atualizado!" : "Catador cadastrado com sucesso!");
    navigate({ to: "/admin" });
  }

  const values = form.watch();
  const errors = form.formState.errors;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`size-9 rounded-full grid place-items-center text-sm font-semibold border-2 transition-colors ${
                    step > s.n
                      ? "bg-primary text-primary-foreground border-primary"
                      : step === s.n
                      ? "bg-primary-soft text-primary border-primary"
                      : "bg-background text-muted-foreground border-border"
                  }`}
                >
                  {step > s.n ? <Check className="size-4" /> : s.n}
                </div>
                <div className="text-xs mt-2 hidden sm:block text-center">
                  <div className={step >= s.n ? "font-medium" : "text-muted-foreground"}>{s.title}</div>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mb-6 sm:mb-8 ${step > s.n ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card">
        <h2 className="text-xl font-bold">{STEPS[step - 1].title}</h2>
        <p className="text-sm text-muted-foreground">{STEPS[step - 1].desc}</p>

        <div className="mt-6 space-y-5">
          {step === 1 && (
            <>
              <Field label="Nome completo *" error={errors.nome_completo?.message}>
                <Input {...form.register("nome_completo")} />
              </Field>
              <Field label="Nome da Cooperativa / Associação / Grupo">
                <Input {...form.register("nome_cooperativa")} placeholder="(opcional)" />
              </Field>
              <Field label="Gênero *" error={errors.genero?.message}>
                <RadioGroup
                  value={values.genero}
                  onValueChange={(v) => form.setValue("genero", v as CatadorFormData["genero"])}
                  className="grid grid-cols-2 gap-2"
                >
                  {GENERO_OPTIONS.map((o) => (
                    <label key={o.value} className="flex items-center gap-2 border border-border rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value={o.value} />
                      <span className="text-sm">{o.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </Field>
              <Field label="Autodeclaração racial *" error={errors.autodeclaracao_racial?.message}>
                <Select value={values.autodeclaracao_racial} onValueChange={(v) => form.setValue("autodeclaracao_racial", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {RACA_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Escolaridade *" error={errors.escolaridade?.message}>
                <Select value={values.escolaridade} onValueChange={(v) => form.setValue("escolaridade", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {ESCOLARIDADE_OPTIONS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="E-mail" error={errors.email?.message}>
                <Input type="email" {...form.register("email")} placeholder="(opcional)" />
              </Field>
              <Field label="Telefone">
                <Input
                  value={values.telefone ?? ""}
                  onChange={(e) => form.setValue("telefone", maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                />
              </Field>
              <Field label="Endereço residencial completo *" error={errors.endereco_completo?.message}>
                <Textarea {...form.register("endereco_completo")} placeholder="Logradouro, número, complemento, bairro, município" rows={3} />
              </Field>
              <p className="text-xs text-muted-foreground">
                Anexos de documentos podem ser feitos depois pelo painel de detalhes.
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <Field label="CPF *" error={errors.cpf?.message}>
                <Input
                  value={values.cpf}
                  onChange={(e) => form.setValue("cpf", maskCPF(e.target.value), { shouldValidate: true })}
                  placeholder="000.000.000-00"
                />
              </Field>
              <Field label="RG / CIN *" error={errors.rg_cin?.message}>
                <Input {...form.register("rg_cin")} />
              </Field>
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Título de Eleitor">
                  <Input {...form.register("titulo_eleitor")} />
                </Field>
                <Field label="CTPS">
                  <Input {...form.register("ctps")} />
                </Field>
                <Field label="NIS">
                  <Input {...form.register("nis")} />
                </Field>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <Field label="Renda média mensal (R$) *" error={errors.renda_media_mensal?.message}>
                <Input type="number" step="0.01" min="0" {...form.register("renda_media_mensal")} />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <SwitchField label="Contribui com o INSS?" checked={values.contribui_inss} onCheckedChange={(v) => form.setValue("contribui_inss", v)} />
                <SwitchField label="Inscrito(a) no CadÚnico?" checked={values.inscrito_cadunico} onCheckedChange={(v) => form.setValue("inscrito_cadunico", v)} />
                <SwitchField label="Possui Bolsa Família?" checked={values.possui_bolsa_familia} onCheckedChange={(v) => form.setValue("possui_bolsa_familia", v)} />
                <SwitchField label="Cadastro no gov.br?" checked={values.cadastro_gov_br} onCheckedChange={(v) => form.setValue("cadastro_gov_br", v)} />
              </div>
              <Field label="Conta bancária digital (ex: Caixa Tem)">
                <Input {...form.register("conta_bancaria_digital")} placeholder="(opcional)" />
              </Field>
              {values.cadastro_gov_br && (
                <Field label="Nível do cadastro gov.br">
                  <Select value={values.nivel_cadastro_gov_br ?? ""} onValueChange={(v) => form.setValue("nivel_cadastro_gov_br", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {NIVEL_GOV_BR_OPTIONS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </>
          )}

          {step === 5 && (
            <>
              <Field label="Materiais coletados *" error={errors.materiais_coletados?.message}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MATERIAIS_OPTIONS.map((m) => {
                    const checked = values.materiais_coletados.includes(m);
                    return (
                      <label key={m} className="flex items-center gap-2 border border-border rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(c) => {
                            const set = new Set(values.materiais_coletados);
                            if (c) set.add(m); else set.delete(m);
                            form.setValue("materiais_coletados", Array.from(set), { shouldValidate: true });
                          }}
                        />
                        <span className="text-sm">{m}</span>
                      </label>
                    );
                  })}
                </div>
              </Field>
              <SwitchField label="Possui carroça?" checked={values.possui_carroca} onCheckedChange={(v) => form.setValue("possui_carroca", v)} />
              {values.possui_carroca && (
                <Field label="Tipo de carroça">
                  <RadioGroup value={values.tipo_carroca ?? ""} onValueChange={(v) => form.setValue("tipo_carroca", v)} className="flex gap-4">
                    <label className="flex items-center gap-2"><RadioGroupItem value="Manual" /> Manual</label>
                    <label className="flex items-center gap-2"><RadioGroupItem value="Motorizada" /> Motorizada</label>
                  </RadioGroup>
                </Field>
              )}
              <Field label="Área de atuação">
                <Textarea {...form.register("area_atuacao")} rows={2} placeholder="Bairros, regiões, pontos de coleta..." />
              </Field>
            </>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <ReviewSection title="Identificação">
                <Row k="Nome" v={values.nome_completo} />
                <Row k="Cooperativa" v={values.nome_cooperativa || "—"} />
                <Row k="Gênero" v={GENERO_OPTIONS.find((g) => g.value === values.genero)?.label ?? "—"} />
                <Row k="Raça/Cor" v={values.autodeclaracao_racial} />
                <Row k="Escolaridade" v={values.escolaridade} />
              </ReviewSection>
              <ReviewSection title="Contato">
                <Row k="E-mail" v={values.email || "—"} />
                <Row k="Telefone" v={values.telefone || "—"} />
                <Row k="Endereço" v={values.endereco_completo} />
              </ReviewSection>
              <ReviewSection title="Documentação">
                <Row k="CPF" v={values.cpf} />
                <Row k="RG/CIN" v={values.rg_cin} />
                <Row k="Título" v={values.titulo_eleitor || "—"} />
                <Row k="CTPS" v={values.ctps || "—"} />
                <Row k="NIS" v={values.nis || "—"} />
              </ReviewSection>
              <ReviewSection title="Socioeconômico">
                <Row k="Renda" v={`R$ ${Number(values.renda_media_mensal).toFixed(2)}`} />
                <Row k="INSS" v={values.contribui_inss ? "Sim" : "Não"} />
                <Row k="CadÚnico" v={values.inscrito_cadunico ? "Sim" : "Não"} />
                <Row k="Bolsa Família" v={values.possui_bolsa_familia ? "Sim" : "Não"} />
                <Row k="gov.br" v={values.cadastro_gov_br ? `Sim (${values.nivel_cadastro_gov_br || "—"})` : "Não"} />
              </ReviewSection>
              <ReviewSection title="Coleta">
                <Row k="Materiais" v={values.materiais_coletados.join(", ") || "—"} />
                <Row k="Carroça" v={values.possui_carroca ? `Sim (${values.tipo_carroca || "—"})` : "Não"} />
                <Row k="Área de atuação" v={values.area_atuacao || "—"} />
              </ReviewSection>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
            <ArrowLeft className="size-4" /> Voltar
          </Button>
          {step < 6 ? (
            <Button type="button" onClick={nextStep}>
              Continuar <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {mode === "edit" ? "Salvar alterações" : "Finalizar cadastro"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function SwitchField({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between border border-border rounded-md px-4 py-3 bg-background">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg p-4 bg-muted/30">
      <h3 className="font-semibold text-sm mb-3 text-primary">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <div className="text-muted-foreground">{k}</div>
      <div className="col-span-2 break-words">{v}</div>
    </div>
  );
}
