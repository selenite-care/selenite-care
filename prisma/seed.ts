import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  // clear existing data
  await prisma.doctor.deleteMany()
  await prisma.service.deleteMany()

  // create 4 services with doctors
  const standard = await prisma.service.create({
    data: {
      name: "Standard Consultation",
      description: "Basic skin analysis and personalized skincare routine.",
      duration: 30,
      price: 29.99,
      doctors: {
        create: [
          { name: "Dr. Ayesha Rahman", designation: "Dermatologist", availability: "Sat–Mon, 10AM–4PM", bio: "5+ years in clinical dermatology." },
          { name: "Dr. Nusrat Jahan", designation: "Skin Specialist", availability: "Sun–Tue, 11AM–5PM", bio: "Expert in acne and pigmentation treatment." },
          { name: "Dr. Fatema Khanam", designation: "Cosmetologist", availability: "Mon–Wed, 9AM–3PM", bio: "Specialized in Korean skincare routines." },
          { name: "Dr. Sadia Islam", designation: "Dermatologist", availability: "Tue–Thu, 10AM–4PM", bio: "Focused on sensitive and reactive skin." },
          { name: "Dr. Meherun Nessa", designation: "Skin Therapist", availability: "Wed–Fri, 12PM–6PM", bio: "Holistic approach to skin wellness." },
        ]
      }
    }
  })

  const premium = await prisma.service.create({
    data: {
      name: "Premium Consultation",
      description: "In-depth skin analysis with a full personalized care plan.",
      duration: 60,
      price: 59.99,
      doctors: {
        create: [
          { name: "Dr. Rashida Begum", designation: "Senior Dermatologist", availability: "Sat–Mon, 9AM–3PM", bio: "15+ years in advanced dermatology." },
          { name: "Dr. Tanzila Hoque", designation: "Aesthetic Physician", availability: "Sun–Tue, 10AM–4PM", bio: "Specialist in anti-aging treatments." },
          { name: "Dr. Sabrina Akter", designation: "Skin Specialist", availability: "Mon–Wed, 11AM–5PM", bio: "Expert in hyperpigmentation and melasma." },
          { name: "Dr. Rifat Ara", designation: "Dermatologist", availability: "Tue–Thu, 9AM–3PM", bio: "Advanced training in skin barrier repair." },
          { name: "Dr. Nazmun Nahar", designation: "Cosmetologist", availability: "Wed–Fri, 10AM–4PM", bio: "Focused on luxury skincare protocols." },
        ]
      }
    }
  })

  const student = await prisma.service.create({
    data: {
      name: "Student Consultation",
      description: "Affordable skincare consultation specially designed for students.",
      duration: 20,
      price: 14.99,
      doctors: {
        create: [
          { name: "Dr. Lamia Sultana", designation: "Skin Therapist", availability: "Sat–Mon, 2PM–7PM", bio: "Passionate about budget-friendly skincare." },
          { name: "Dr. Sumaia Khatun", designation: "Cosmetologist", availability: "Sun–Tue, 1PM–6PM", bio: "Focused on student skin concerns." },
          { name: "Dr. Nadia Hasan", designation: "Dermatologist", availability: "Mon–Wed, 3PM–7PM", bio: "Specialist in acne for young adults." },
          { name: "Dr. Taslima Akter", designation: "Skin Specialist", availability: "Tue–Thu, 2PM–6PM", bio: "Affordable and effective skincare plans." },
          { name: "Dr. Marium Begum", designation: "Skin Therapist", availability: "Wed–Fri, 1PM–5PM", bio: "Gentle treatments for teenage skin." },
        ]
      }
    }
  })

  const online = await prisma.service.create({
    data: {
      name: "Online Consultation",
      description: "Remote skincare consultation from the comfort of your home.",
      duration: 30,
      price: 19.99,
      doctors: {
        create: [
          { name: "Dr. Farhana Yeasmin", designation: "Dermatologist", availability: "Sat–Mon, 8AM–2PM", bio: "Expert in remote skin diagnosis." },
          { name: "Dr. Shirin Akter", designation: "Skin Specialist", availability: "Sun–Tue, 9AM–3PM", bio: "Online consultations for 7+ years." },
          { name: "Dr. Parveen Sultana", designation: "Cosmetologist", availability: "Mon–Wed, 10AM–4PM", bio: "Specialized in virtual skincare routines." },
          { name: "Dr. Kohinoor Begum", designation: "Aesthetic Physician", availability: "Tue–Thu, 8AM–2PM", bio: "Focused on accessible online care." },
          { name: "Dr. Nasrin Islam", designation: "Skin Therapist", availability: "Wed–Fri, 9AM–3PM", bio: "Holistic online skin wellness expert." },
        ]
      }
    }
  })

  console.log("Seeded services and doctors successfully!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())