import { prisma } from "../lib/prisma";

async function main() {
  const project = await prisma.project.findFirst();
  const user = await prisma.user.findFirst();
  if (!project || !user) {
    console.log("No project or user found in DB");
    return;
  }

  const existing = await prisma.coreSample.count();
  if (existing === 0) {
    await prisma.coreSample.createMany({
      data: [
        {
          qrCode: "SMP-14582-A3K-9421",
          projectId: project.id,
          takenById: user.id,
          location: "A Blok, 3. Kat Kolon C4",
          status: "TAKEN",
          notes: "C30/37 hazır beton, döküm slump: 16cm, mikser: 34-AC-921",
        },
        {
          qrCode: "SMP-14582-BRD-8152",
          projectId: project.id,
          takenById: user.id,
          location: "B Blok, Radye Temel Aks 4-D",
          status: "IN_LAB",
          notes: "Kür havuzuna alındı, 7 günlük ve 28 günlük kırım planlandı",
        },
        {
          qrCode: "SMP-14582-2TK-4719",
          projectId: project.id,
          takenById: user.id,
          location: "2. Kat Tabliye Kiriş K-108",
          status: "TESTED",
          resultStrength: 34.65,
          isPassed: true,
          testedAt: new Date(),
          reportFileUrl: "https://utfs.io/f/sample-crush-report-pass.pdf",
          notes: "AI OCR ile analiz edildi: 34.65 MPa (UYGUN / PASS)",
        },
      ],
    });
    console.log("Successfully seeded 3 realistic core samples into Neon PostgreSQL!");
  } else {
    console.log("Samples already exist:", existing);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
