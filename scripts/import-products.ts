import { PrismaClient } from "@prisma/client"
import fs from "fs"
import path from "path"
import Papa from "papaparse"

const prisma = new PrismaClient()

async function main() {
  const csvPath = path.join(process.cwd(), "scripts", "products.csv")
  const csvContent = fs.readFileSync(csvPath, "utf-8")

  const { data } = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
  })

  console.log(`Importing ${data.length} products...`)

  let success = 0
  let skipped = 0

  for (const row of data as any[]) {
    const name = row["Product Name"]?.trim()
    const type = row["Type"]?.trim()
    const priceRaw = row["Price"]?.toString().replace(/,/g, "").trim()
    const skinType = row["Skin Type"]?.trim() || null

    if (!name || !type || !priceRaw) {
      skipped++
      continue
    }

    const price = parseFloat(priceRaw)

    if (isNaN(price)) {
      skipped++
      continue
    }

    await prisma.product.create({
      data: {
        name,
        type,
        price,
        skinType,
      },
    })

    success++
  }

  console.log(`Imported: ${success}, Skipped: ${skipped}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())