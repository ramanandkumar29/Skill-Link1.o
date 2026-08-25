import BrandHelpline from "@/components/BrandHelpline";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export const metadata = {
  title: "Official Brand Helplines & Warranty Directory - SkillLink",
  description: "Direct toll-free phone numbers and WhatsApp links for Samsung, LG, Whirlpool, Voltas, Havells, Crompton, Godrej.",
};

export default function HelplinesPage() {
  return (
    <div className="space-y-6">
      <Header activeSection="HELPLINES" />
      <BrandHelpline />
      <BottomNav activeSection="HELPLINES" />
    </div>
  );
}
