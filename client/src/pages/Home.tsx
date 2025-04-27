import ShiftForm from "@/components/ShiftForm";
import { ShiftFormProvider } from "@/context/ShiftFormContext";

export default function Home() {
  return (
    <div className="min-h-screen p-4 md:p-6">
      <ShiftFormProvider>
        <ShiftForm />
      </ShiftFormProvider>
      <footer className="text-center text-sm text-neutral-darkest mt-8">
        <p>© מערכת דיווח משמרות</p>
      </footer>
    </div>
  );
}
