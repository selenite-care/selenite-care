import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  await prisma.service.createMany({
    data: [
      { name: "Basic Skin Consultation", description: "30 min basic skin analysis", duration: 30, price: 1500 },
      { name: "Advanced Skin Consultation", description: "60 min deep skin analysis", duration: 62, price: 5900 },
      { name: "Premium Consultation", description: "90 min full skin care plan", duration: 90, price: 3200 },
    ]
  })
}

main().then(() => prisma.$disconnect())