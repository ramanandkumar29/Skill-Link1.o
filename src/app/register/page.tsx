import SahayakVoice from "@/components/SahayakVoice";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export const metadata = {
  title: "Sahayak AI Voice Onboarding - SkillLink",
  description: "Register as a verified service professional using Sahayak 2-Way Voice Assistant in Hindi.",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <Header activeSection="SAHAYAK" />
      <SahayakVoice />
      <BottomNav activeSection="SAHAYAK" />
    </div>
  );
}
