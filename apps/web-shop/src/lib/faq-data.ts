export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: "Ordering & Delivery" | "Products & Shelf Life" | "Account & Payments" | "Returns & Support";
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "faq-1",
    category: "Products & Shelf Life",
    question: "What makes Bren Raphael's Ube Halaya special?",
    answer: "Our Ube Jam & Halaya is handcrafted in Baguio City using 100% genuine Cordillera purple yam, fresh carabao's milk, real butter, and zero artificial preservatives or fillers.",
  },
  {
    id: "faq-2",
    category: "Products & Shelf Life",
    question: "How long does the Ube Halaya last?",
    answer: "Unopened, refrigerated jars last up to 3 weeks. Once opened, consume within 7–10 days. For longer shelf life, you can freeze unopened jars for up to 3 months.",
  },
  {
    id: "faq-3",
    category: "Products & Shelf Life",
    question: "Is your Ube Halaya gluten-free?",
    answer: "Yes! Our traditional Ube Halaya contains only pure purple yam, milk, butter, and sugar. No wheat flour or gluten-containing starches are added.",
  },
  {
    id: "faq-4",
    category: "Ordering & Delivery",
    question: "How long does shipping take?",
    answer: "Standard Metro Manila delivery takes 1–3 business days. Provincial Luzon takes 3–5 business days, and Visayas/Mindanao takes 5–7 business days via insulated courier packaging.",
  },
  {
    id: "faq-5",
    category: "Ordering & Delivery",
    question: "Do you offer same-day delivery?",
    answer: "Same-day delivery is available for select areas in Metro Manila and Baguio City via GrabExpress or Lalamove for orders placed before 12:00 PM PST.",
  },
  {
    id: "faq-6",
    category: "Account & Payments",
    question: "What payment methods do you accept?",
    answer: "We accept Cash on Delivery (COD), GCash, Maya, credit/debit card payments, and online bank transfers.",
  },
  {
    id: "faq-7",
    category: "Account & Payments",
    question: "Do I need an account to place an order?",
    answer: "You can browse products as a guest, but creating an account allows you to track orders, save shipping addresses, and use live chat support.",
  },
  {
    id: "faq-8",
    category: "Returns & Support",
    question: "What is your return & refund policy?",
    answer: "Due to the perishable nature of our products, returns are accepted only for damaged or incorrect items reported within 48 hours of delivery.",
  },
  {
    id: "faq-9",
    category: "Returns & Support",
    question: "How can I contact customer support?",
    answer: "You can use our 24/7 Live Chat widget at the bottom right corner of the screen, or fill out the form on our Contact Us page.",
  },
];
