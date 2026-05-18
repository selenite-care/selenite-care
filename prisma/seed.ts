import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  await prisma.service.createMany({
    data: [
      { name: "Basic Skin Consultation", description: "30 min basic skin analysis", duration: 30, price: 29.99 },
      { name: "Advanced Skin Consultation", description: "60 min deep skin analysis", duration: 62, price: 59.99 },
      { name: "Premium Consultation", description: "90 min full skin care plan", duration: 90, price: 85.99 },
    ]
  })
}

main().then(() => prisma.$disconnect())