export type FAQItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

export const FAQS: FAQItem[] = [
  { id: "1", category: "General", question: "What is Selenite Care?", answer: "Selenite Care is a skincare consultation and wellness platform that provides personalized skin analysis, expert guidance, customized skincare routines, and ongoing support to help clients achieve healthier skin and long-term results." },
  { id: "2", category: "Membership & Payments", question: "What are Membership Programs?", answer: "Our Membership Programs - Signature, Crystal, and Platinum - provide unlimited consultations within the active membership period, along with extended specialist support, personalized skincare consultation, advanced skin analysis, expert guidance, customized routines, and ongoing online and offline support to help clients achieve long-term skin improvement." },
  { id: "3", category: "Consultation & Skin Analysis", question: "How does the consultation process work?", answer: "After booking a consultation, you will complete a skin assessment form and submit clear photographs of your skin. Our Aesthetician will review your information and provide personalized recommendations during your consultation session." },
  { id: "4", category: "Consultation & Skin Analysis", question: "What skin concerns do you help with?", answer: "We provide guidance for a wide range of skin concerns, including: Acne and breakouts, Acne scars, Hyperpigmentation, PIE and PIH, Melasma, Uneven skin tone, Sensitive skin, Dry and dehydrated skin, Oily skin, Aging concerns, Skin barrier damage." },
  { id: "5", category: "General", question: "Do you provide medical treatment or prescriptions?", answer: "Selenite Care provides skincare consultation, education, and product recommendations. We do not diagnose medical conditions or prescribe medications." },
  { id: "6", category: "Consultation & Skin Analysis", question: "Will I receive a personalized skincare routine?", answer: "Depending on the benefits of your Membership and based on your skin assessment and consultation, you will receive a customized skincare routine according to your skin type, concerns and goals." },
  { id: "7", category: "Consultation & Skin Analysis", question: "How soon can I expect results?", answer: "Results vary depending on individual skin conditions, consistency, lifestyle factors, and recommended routines. Most clients begin noticing improvements within 4 to 12 weeks of following their personalized plan consistently." },
  { id: "8", category: "Membership & Payments", question: "Do I have to purchase products from Selenite Care?", answer: "Yes, as you will receive a complete personalized product recommendation and skin report during consultation. For convenience, Selenite Care can provide all recommended products in one place. Product purchases from Selenite Care can open up other benefits in terms of membership." },
  { id: "9", category: "Consultation & Skin Analysis", question: "What is Digital Skin Analysis?", answer: "Digital Skin Analysis is a detailed assessment of your skin using submitted photographs and information from your skin assessment form. It helps us better understand your skin concerns before providing recommendations." },
  { id: "10", category: "Consultation & Skin Analysis", question: "How do I prepare for a skin analysis?", answer: "Kindly submit: Clear, makeup-free photographs, Good natural lighting images, Recent information about your skincare routine, Details of any skin concerns or sensitivities." },
  { id: "11", category: "Membership & Payments", question: "Is the membership fee refundable?", answer: "Membership fees are generally non-refundable once services have commenced. Please review our Terms and Conditions for complete details." },
  { id: "12", category: "Privacy & Booking", question: "Will my personal information remain confidential?", answer: "Yes. We respect your privacy and maintain strict confidentiality regarding all personal information, consultation records, photographs, and assessment details." },
  { id: "13", category: "Privacy & Booking", question: "How can I book a consultation?", answer: "You can book a consultation directly through our website, social media platforms, WhatsApp, or by contacting our customer support team." },
  { id: "14", category: "General", question: "What makes Selenite Care different?", answer: "Our approach goes beyond product recommendations. We focus on personalized consultation, skin education, long-term transformation, continuous support, and creating a premium skincare experience designed for every individual." },
  { id: "15", category: "General", question: "Do you guarantee results?", answer: "Every persons skin is unique. While we provide personalized recommendations and support by Certified Aestheticians, results depend on factors such as consistency, skin condition, lifestyle, and adherence to the recommended routine. Therefore, specific results cannot be guaranteed." },
];

export function getFAQsByCategory() {
  const categories = Array.from(new Set(FAQS.map((f) => f.category)));
  return categories.map((category) => ({
    category,
    items: FAQS.filter((f) => f.category === category),
  }));
}
