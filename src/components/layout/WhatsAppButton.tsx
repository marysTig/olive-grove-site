import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { settingsQuery } from "@/lib/queries";

export function WhatsAppButton() {
  const { data: settings } = useQuery(settingsQuery());
  const number = settings?.whatsapp_number;
  if (!number) return null;

  return (
    <motion.a
      href={`https://wa.me/${number.replace(/\D/g, "")}`}
      target="_blank"
      rel="noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.8, type: "spring" }}
      whileHover={{ scale: 1.08 }}
      className="fixed bottom-5 end-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-elegant"
      aria-label="WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </motion.a>
  );
}
