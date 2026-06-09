import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  await prisma.doctor.deleteMany()
  await prisma.service.deleteMany()

  await prisma.service.createMany({
    data: [
      {
        name: "Standard Consultation",
        description: "Basic skin analysis and personalized skincare routine.",
        price: 29.99,
      },
      {
        name: "Premium Consultation",
        description: "In-depth skin analysis with a full personalized care plan.",
        price: 59.99,
      },
      {
        name: "Student Consultation",
        description: "Affordable skincare consultation specially designed for students.",
        price: 14.99,
      },
      {
        name: "Online Consultation",
        description: "Remote skincare consultation from the comfort of your home.",
        price: 19.99,
      },
    ],
  })

  await prisma.doctor.createMany({
    data: [
      {
        name: "Dr. Ayesha Rahman",
        designation: "Dermatologist",
        availability: "Sat-Mon, 10AM-4PM",
        bio: "5+ years in clinical dermatology.",
        image: "https://ui-avatars.com/api/?name=Ayesha+Rahman&background=f9a8d4&color=fff&size=200",
      },
      {
        name: "Dr. Nusrat Jahan",
        designation: "Skin Specialist",
        availability: "Sun-Tue, 11AM-5PM",
        bio: "Expert in acne and pigmentation treatment.",
        image: "https://ui-avatars.com/api/?name=Nusrat+Jahan&background=f9a8d4&color=fff&size=200",
      },
      {
        name: "Dr. Fatema Khanam",
        designation: "Cosmetologist",
        availability: "Mon-Wed, 9AM-3PM",
        bio: "Specialized in Korean skincare routines.",
        image: "https://ui-avatars.com/api/?name=Fatema+Khanam&background=f9a8d4&color=fff&size=200",
      },
      {
        name: "Dr. Sadia Islam",
        designation: "Dermatologist",
        availability: "Tue-Thu, 10AM-4PM",
        bio: "Focused on sensitive and reactive skin.",
        image: "https://ui-avatars.com/api/?name=Sadia+Islam&background=f9a8d4&color=fff&size=200",
      },
      {
        name: "Dr. Meherun Nessa",
        designation: "Skin Therapist",
        availability: "Wed-Fri, 12PM-6PM",
        bio: "Holistic approach to skin wellness.",
        image: "https://ui-avatars.com/api/?name=Meherun+Nessa&background=f9a8d4&color=fff&size=200",
      },
      {
        name: "Dr. Rashida Begum",
        designation: "Senior Dermatologist",
        availability: "Sat-Mon, 9AM-3PM",
        bio: "15+ years in advanced dermatology.",
        image: "https://ui-avatars.com/api/?name=Rashida+Begum&background=f9a8d4&color=fff&size=200",
      },
      {
        name: "Dr. Tanzila Hoque",
        designation: "Aesthetic Physician",
        availability: "Sun-Tue, 10AM-4PM",
        bio: "Specialist in anti-aging treatments.",
        image: "https://ui-avatars.com/api/?name=Tanzila+Hoque&background=f9a8d4&color=fff&size=200",
      },
      {
        name: "Dr. Sabrina Akter",
        designation: "Skin Specialist",
        availability: "Mon-Wed, 11AM-5PM",
        bio: "Expert in hyperpigmentation and melasma.",
        image: "https://ui-avatars.com/api/?name=Sabrina+Akter&background=f9a8d4&color=fff&size=200",
      },
      {
        name: "Dr. Rifat Ara",
        designation: "Dermatologist",
        availability: "Tue-Thu, 9AM-3PM",
        bio: "Advanced training in skin barrier repair.",
        image: "https://ui-avatars.com/api/?name=Rifat+Ara&background=f9a8d4&color=fff&size=200",
      },
      {
        name: "Dr. Nazmun Nahar",
        designation: "Cosmetologist",
        availability: "Wed-Fri, 10AM-4PM",
        bio: "Focused on luxury skincare protocols.",
        image: "https://ui-avatars.com/api/?name=Nazmun+Nahar&background=f9a8d4&color=fff&size=200",
      },
      {
        name: "Dr. Lamia Sultana",
        designation: "Skin Therapist",
        availability: "Sat-Mon, 2PM-7PM",
        bio: "Passionate about budget-friendly skincare.",
        image: "https://ui-avatars.com/api/?name=Lamia+Sultana&background=f9a8d4&color=fff&size=200",
      },
      {
        name: "Dr. Sumaia Khatun",
        designation: "Cosmetologist",
        availability: "Sun-Tue, 1PM-6PM",
        bio: "Focused on student skin concerns.",
        image: "https://ui-avatars.com/api/?name=Sumaia+Khatun&background=f9a8d4&color=fff&size=200",
      },
      {
        name: "Dr. Nadia Hasan",
        designation: "Dermatologist",
        availability: "Mon-Wed, 3PM-7PM",
        bio: "Specialist in acne for young adults.",
        image: "https://ui-avatars.com/api/?name=Nadia+Hasan&background=f9a8d4&color=fff&size=200",
      },
      {
        name: "Dr. Taslima Akter",
        designation: "Skin Specialist",
        availability: "Tue-Thu, 2PM-6PM",
        bio: "Affordable and effective skincare plans.",
        image: "https://ui-avatars.com/api/?name=Taslima+Akter&background=f9a8d4&color=fff&size=200",
      },
      {
        name: "Dr. Marium Begum",
        designation: "Skin Therapist",
        availability: "Wed-Fri, 1PM-5PM",
        bio: "Gentle treatments for teenage skin.",
        image: "https://ui-avatars.com/api/?name=Marium+Begum&background=f9a8d4&color=fff&size=200",
      },
      {
        name: "Dr. Farhana Yeasmin",
        designation: "Dermatologist",
        availability: "Sat-Mon, 8AM-2PM",
        bio: "Expert in remote skin diagnosis.",
        image: "https://ui-avatars.com/api/?name=Farhana+Yeasmin&background=f9a8d4&color=fff&size=200",
      },
      {
        name: "Dr. Shirin Akter",
        designation: "Skin Specialist",
        availability: "Sun-Tue, 9AM-3PM",
        bio: "Online consultations for 7+ years.",
        image: "https://ui-avatars.com/api/?name=Shirin+Akter&background=f9a8d4&color=fff&size=200",
      },
      {
        name: "Dr. Parveen Sultana",
        designation: "Cosmetologist",
        availability: "Mon-Wed, 10AM-4PM",
        bio: "Specialized in virtual skincare routines.",
        image: "https://ui-avatars.com/api/?name=Parveen+Sultana&background=f9a8d4&color=fff&size=200",
      },
      {
        name: "Dr. Kohinoor Begum",
        designation: "Aesthetic Physician",
        availability: "Tue-Thu, 8AM-2PM",
        bio: "Focused on accessible online care.",
        image: "https://ui-avatars.com/api/?name=Kohinoor+Begum&background=f9a8d4&color=fff&size=200",
      },
      {
        name: "Dr. Nasrin Islam",
        designation: "Skin Therapist",
        availability: "Wed-Fri, 9AM-3PM",
        bio: "Holistic online skin wellness expert.",
        image: "https://ui-avatars.com/api/?name=Nasrin+Islam&background=f9a8d4&color=fff&size=200",
      },
    ],
  })

  console.log("Seeded services and doctors successfully!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
