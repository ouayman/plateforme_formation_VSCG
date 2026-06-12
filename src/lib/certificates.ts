import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { getActiveTrainingParticipantIds } from "@/lib/user-training";

export async function ensureCertificate(userId: string, trainingId: string) {
  return prisma.certificate.upsert({
    where: { userId_trainingId: { userId, trainingId } },
    create: { userId, trainingId },
    update: {},
  });
}

export async function ensureCertificatesForAssignedTraining(trainingId: string) {
  const participantIds = await getActiveTrainingParticipantIds(trainingId);
  await Promise.all(participantIds.map((userId) => ensureCertificate(userId, trainingId)));
}

/** @deprecated — utiliser ensureCertificatesForAssignedTraining */
export async function ensureCertificatesForTraining(trainingId: string) {
  return ensureCertificatesForAssignedTraining(trainingId);
}

export async function removeCertificate(userId: string, trainingId: string) {
  await prisma.certificate.deleteMany({
    where: { userId, trainingId },
  });
}

export async function removeCertificatesForProgramUser(userId: string, programId: string) {
  await prisma.certificate.deleteMany({
    where: {
      userId,
      training: { programId },
    },
  });
}

type CertificateData = {
  certificateTitle: string;
  programName: string;
  participantName: string;
  companyName: string;
  signatoryName: string | null;
  signatoryTitle: string | null;
  generatedAt: Date;
};

export function buildCertificateHtml(data: CertificateData) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${data.certificateTitle}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      background: #f8fafc;
      color: #0f172a;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .certificate {
      width: 900px;
      max-width: 100%;
      background: white;
      border: 3px solid #CD3465;
      padding: 3rem 4rem;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.08);
    }
    .brand { font-size: 0.85rem; letter-spacing: 0.2em; text-transform: uppercase; color: #64748b; }
    h1 { font-size: 2rem; margin: 1.5rem 0 0.5rem; color: #CD3465; }
    .program { font-size: 1rem; color: #64748b; margin-bottom: 2rem; }
    .label { font-size: 0.9rem; color: #64748b; margin-bottom: 0.5rem; }
    .name { font-size: 2.2rem; font-weight: bold; margin-bottom: 0.5rem; }
    .company { font-size: 1rem; color: #475569; margin-bottom: 2.5rem; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e2e8f0; }
    .signatory { text-align: left; font-size: 0.95rem; }
    .date { text-align: right; font-size: 0.95rem; color: #64748b; }
    @media print { body { background: white; padding: 0; } .certificate { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="certificate">
    <p class="brand">Value Stream Consulting</p>
    <h1>${escapeHtml(data.certificateTitle)}</h1>
    <p class="program">${escapeHtml(data.programName)}</p>
    <p class="label">Décerné à</p>
    <p class="name">${escapeHtml(data.participantName)}</p>
    <p class="company">${escapeHtml(data.companyName)}</p>
    <div class="footer">
      <div class="signatory">
        ${
          data.signatoryName
            ? `<strong>${escapeHtml(data.signatoryName)}</strong><br/>${escapeHtml(data.signatoryTitle ?? "")}`
            : "<span>—</span>"
        }
      </div>
      <div class="date">Délivré le ${formatDate(data.generatedAt)}</div>
    </div>
  </div>
  <script>window.onload = () => { if (new URLSearchParams(location.search).get('print') === '1') window.print(); };</script>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
