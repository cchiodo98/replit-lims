import { db } from "./server/db";
import { samples, sampleTests, sampleIdSequence, materialTypeTests, materialTypes, testDefinitions, systemSettings } from "./shared/schema";
import { eq } from "drizzle-orm";

const CLIENT_NAMES = [
  "Cargill Inc.", "ADM", "Bunge Limited", "Darling Ingredients", "Kemin Industries",
  "Novus International", "Perdue Farms", "Tyson Foods", "Smithfield Foods", "JBS USA",
  "Pilgrim's Pride", "Sanderson Farms", "Mountaire Farms", "Wayne Farms", "Koch Foods",
  "Cal-Maine Foods", "Land O'Lakes", "Dairy Farmers of America", "Dean Foods", "Saputo Inc.",
  "Valero Energy", "Green Plains", "Pacific Biodiesel", "Renewable Energy Group", "World Energy",
];

const SUBMITTERS = [
  "Chris Chiodo", "Mike Johnson", "Sarah Williams", "James Brown", "Emily Davis",
  "Robert Wilson", "Lisa Anderson", "David Martinez", "Jennifer Taylor", "Michael Thomas",
];

const STATUSES = ["pending", "received", "processing", "completed", "verified"];
const PRIORITIES: string[] = ["normal", "normal", "normal", "urgent", "rush"];

function randomDate(daysBack: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 12) + 6, Math.floor(Math.random() * 60));
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  const allMTs = await db.select().from(materialTypes);
  if (allMTs.length === 0) {
    console.error("No material types found. Create some first.");
    process.exit(1);
  }
  console.log(`Found ${allMTs.length} material types: ${allMTs.map(m => m.name).join(", ")}`);

  const mtTestMap: Record<number, number[]> = {};
  const allMtTests = await db.select().from(materialTypeTests);
  for (const mt of allMTs) {
    mtTestMap[mt.id] = allMtTests.filter(t => t.materialTypeId === mt.id).map(t => t.testDefinitionId);
  }

  const allTests = await db.select().from(testDefinitions);
  const fallbackTestIds = allTests.slice(0, 2).map(t => t.id);

  let prefix = "CHM";
  const prefixRow = await db.select().from(systemSettings).where(eq(systemSettings.key, "sampleIdPrefix"));
  if (prefixRow.length > 0 && prefixRow[0].value) prefix = prefixRow[0].value;

  const year = 2026;
  const seqRow = await db.select().from(sampleIdSequence).where(eq(sampleIdSequence.year, year));
  const startNum = (seqRow.length > 0 ? seqRow[0].lastNumber : 0) + 1;

  const TOTAL = 500;
  const BATCH = 50;

  console.log(`Prefix: ${prefix}, starting at number ${startNum}`);
  console.log(`Generating ${TOTAL} samples...`);

  for (let batch = 0; batch < TOTAL / BATCH; batch++) {
    const sampleValues = [];
    for (let i = 0; i < BATCH; i++) {
      const num = startNum + batch * BATCH + i;
      const trackingId = `${prefix}-${year}-${String(num).padStart(4, "0")}`;
      const mt = pick(allMTs);
      const collDate = randomDate(180);
      const status = pick(STATUSES);
      const receivedAt = status !== "pending" ? new Date(collDate.getTime() + Math.random() * 3 * 86400000) : null;
      const dueDate = receivedAt ? new Date(receivedAt.getTime() + 7 * 86400000) : new Date(collDate.getTime() + 10 * 86400000);

      sampleValues.push({
        trackingId,
        clientName: pick(CLIENT_NAMES),
        submittedBy: pick(SUBMITTERS),
        materialTypeId: mt.id,
        collectionDate: collDate,
        receivedAt,
        dueDate,
        status,
        priority: pick(PRIORITIES),
        notes: Math.random() > 0.7 ? `Batch ${Math.floor(Math.random() * 9000) + 1000}` : null,
      });
    }

    const inserted = await db.insert(samples).values(sampleValues).returning();
    console.log(`  Batch ${batch + 1}/${TOTAL / BATCH}: inserted ${inserted.length} samples`);

    const testRows: any[] = [];
    for (const s of inserted) {
      const testIds = mtTestMap[s.materialTypeId!] || fallbackTestIds;
      if (testIds.length === 0) continue;

      for (const tid of testIds) {
        let testStatus = "pending";
        let result = null;
        let outOfSpec = false;
        let completedAt = null;
        let verifiedAt = null;

        if (s.status === "completed" || s.status === "verified" || s.status === "processing") {
          if (s.status === "processing" && Math.random() > 0.5) {
            testStatus = "pending";
          } else {
            testStatus = s.status === "verified" ? "verified" : "completed";
            result = String((Math.random() * 100).toFixed(2));
            outOfSpec = Math.random() > 0.9;
            completedAt = new Date((s.receivedAt || s.collectionDate!).getTime() + Math.random() * 5 * 86400000);
            if (s.status === "verified") {
              verifiedAt = new Date(completedAt.getTime() + Math.random() * 2 * 86400000);
            }
          }
        }

        testRows.push({
          sampleId: s.id,
          testDefinitionId: tid,
          result,
          status: testStatus,
          outOfSpec,
          completedAt,
          verifiedAt,
          notes: null,
        });
      }
    }

    if (testRows.length > 0) {
      const TBATCH = 100;
      for (let t = 0; t < testRows.length; t += TBATCH) {
        await db.insert(sampleTests).values(testRows.slice(t, t + TBATCH));
      }
    }
  }

  const finalNum = startNum + TOTAL - 1;
  await db.insert(sampleIdSequence).values({ year, lastNumber: finalNum })
    .onConflictDoUpdate({ target: sampleIdSequence.year, set: { lastNumber: finalNum } });

  console.log(`Done! Generated ${TOTAL} samples with test records.`);
  console.log(`Sample ID sequence updated to ${prefix}-${year}-${String(finalNum).padStart(4, "0")}`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
