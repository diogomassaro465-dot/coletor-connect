import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Association = Record<string, any>;
type Assessment = Record<string, any>;
type Catador = Record<string, any>;
type DocumentRow = Record<string, any>;

const fmtDate = (v?: string | null) =>
  v ? new Date(`${v}${v.length === 10 ? "T12:00:00" : ""}`).toLocaleDateString("pt-BR") : "—";

const STATUS_LABEL: Record<string, string> = {
  regular: "Regular",
  parcialmente_regular: "Parcialmente regular",
  irregular: "Irregular",
};

const CATEGORY_LABEL: Record<string, string> = {
  estatuto: "Estatuto",
  ata: "Ata",
  alvara: "Alvará",
  licenca_ambiental: "Licença ambiental",
  balanco: "Balanço",
  comprovante: "Comprovante",
  outros: "Outros",
};

export function buildAssociationReportPDF(input: {
  association: Association;
  assessments: Assessment[];
  catadores: Catador[];
  documents: DocumentRow[];
}) {
  const { association, assessments, catadores, documents } = input;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // Header
  doc.setFillColor(20, 83, 45);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Relatório institucional — PROCATE", margin, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `Gerado em ${new Date().toLocaleString("pt-BR")}`,
    margin,
    50,
  );
  doc.setTextColor(0, 0, 0);
  y = 92;

  // Identification
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(association.nome ?? "Associação", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const idLines = [
    `Município: ${association.municipio ?? "—"}`,
    `Tipo: ${association.tipo === "formal" ? "Formal" : "Informal"} • Status: ${association.ativa ? "Ativa" : "Inativa"}`,
    `CNPJ: ${association.cnpj ?? "—"}`,
    `Endereço: ${association.endereco ?? "—"}`,
    `Associados (início → atual): ${association.numero_associados_inicial ?? "—"} → ${association.numero_associados_atual ?? "—"}`,
    `Catadores cadastrados: ${catadores.length}`,
  ];
  idLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 14;
  });
  y += 6;

  // Latest assessment summary
  const latest = assessments[0];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Último diagnóstico", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  if (!latest) {
    doc.text("Nenhum diagnóstico registrado.", margin, y);
    y += 18;
  } else {
    const lines = [
      `Data da visita: ${fmtDate(latest.data_visita)} • Consultor(a): ${latest.consultant_name ?? "—"}`,
      `Índice de regularidade: ${Number(latest.regularity_index ?? 0).toLocaleString("pt-BR")}% • Status: ${STATUS_LABEL[latest.status] ?? latest.status}`,
      `Evidências validadas: ${latest.evidence_validated ? "Sim" : "Não"}`,
    ];
    lines.forEach((line) => {
      doc.text(line, margin, y);
      y += 14;
    });
    y += 4;
  }

  // Diagnostics history table
  if (assessments.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Data", "Consultor(a)", "Índice", "Status", "Evidências"]],
      body: assessments.map((a) => [
        fmtDate(a.data_visita),
        a.consultant_name ?? "—",
        `${Number(a.regularity_index ?? 0).toLocaleString("pt-BR")}%`,
        STATUS_LABEL[a.status] ?? a.status,
        a.evidence_validated ? "Validadas" : "Pendentes",
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [20, 83, 45] },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 16;
  }

  // Documents table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  if (y > 720) {
    doc.addPage();
    y = margin;
  }
  doc.text("Documentos institucionais", margin, y);
  y += 8;
  if (documents.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Nenhum documento anexado.", margin, y + 12);
    y += 24;
  } else {
    autoTable(doc, {
      startY: y + 6,
      head: [["Categoria", "Título", "Emitido", "Validade"]],
      body: documents.map((d) => [
        CATEGORY_LABEL[d.category] ?? d.category,
        d.title,
        fmtDate(d.issued_at),
        fmtDate(d.expires_at),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [20, 83, 45] },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 16;
  }

  // Catadores summary
  if (y > 720) {
    doc.addPage();
    y = margin;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Resumo de catadores", margin, y);
  y += 8;
  const byGender = catadores.reduce<Record<string, number>>((acc, c) => {
    const k = c.genero ?? "Não informado";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  autoTable(doc, {
    startY: y + 6,
    head: [["Indicador", "Valor"]],
    body: [
      ["Total cadastrado", String(catadores.length)],
      ...Object.entries(byGender).map(([k, v]) => [`Gênero: ${k}`, String(v)]),
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [20, 83, 45] },
    margin: { left: margin, right: margin },
  });

  // Footer pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `PROCATE • ${association.nome ?? ""} • Página ${i}/${pageCount}`,
      margin,
      doc.internal.pageSize.getHeight() - 16,
    );
  }

  const safeName = (association.nome ?? "associacao")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();
  doc.save(`relatorio-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
