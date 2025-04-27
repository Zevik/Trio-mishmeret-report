import { createContext, useState, useContext, ReactNode } from "react";

export type ShiftType = "רפואה שלמה" | "מיזם טריו" | "דמו" | "הכשרה" | "";

export interface FormData {
  // User identification
  userId: string;
  userName: string;
  
  // Basic fields
  shiftType: ShiftType;
  doctorName: string;
  instructorName: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  calculatedDuration: string;
  manualDuration: string;
  location: "בית" | "מרפאה";
  shiftNotes: string;
  
  // Complete Healthcare fields
  casesHandled: number;
  screenshotsSent: boolean;
  
  // Trio Project fields
  trioCasesHandled: number;
  macabiTasks: number;
  shiftQuality: "1" | "2" | "3" | "4";
  

  
  // Demo fields
  demoCasesHandled: number;
  demoOrder: "1" | "2" | "3" | "4";
  communicationClarity: "1" | "2" | "3" | "4";
  communicationPleasantness: "1" | "2" | "3" | "4";
  demoScreenshotsSent: boolean;
  
  // Training fields
  trainingOrder: "1" | "2" | "3" | "4";
  trainingQuality: "1" | "2" | "3" | "4";
}

export interface FormState {
  isUserVerified: boolean;
  isFormSubmitting: boolean;
  isFormSubmitted: boolean;
  formError: string | null;
  doctorOptions: string[];
  showAutocomplete: boolean;
}

interface ShiftFormContextType {
  formData: FormData;
  formState: FormState;
  setFormData: (data: Partial<FormData>) => void;
  setFormState: (state: Partial<FormState>) => void;
  resetForm: () => void;
}

const defaultFormData: FormData = {
  userId: "",
  userName: "",
  
  shiftType: "",
  doctorName: "",
  instructorName: "",
  sessionDate: new Date().toISOString().split('T')[0],
  startTime: "",
  endTime: "",
  calculatedDuration: "",
  manualDuration: "",
  location: "בית",
  shiftNotes: "",
  
  casesHandled: 0,
  screenshotsSent: false,
  
  trioCasesHandled: 0,
  macabiTasks: 0,
  shiftQuality: "4",
  
  demoCasesHandled: 0,
  demoOrder: "1",
  communicationClarity: "4",
  communicationPleasantness: "4",
  demoScreenshotsSent: false,
  
  trainingOrder: "1",
  trainingQuality: "4"
};

const defaultFormState: FormState = {
  isUserVerified: false,
  isFormSubmitting: false,
  isFormSubmitted: false,
  formError: null,
  doctorOptions: [],
  showAutocomplete: false
};

const ShiftFormContext = createContext<ShiftFormContextType | undefined>(undefined);

export function ShiftFormProvider({ children }: { children: ReactNode }) {
  const [formData, setFormDataState] = useState<FormData>(() => {
    // Try to load userId from localStorage
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      return {
        ...defaultFormData,
        userId: storedUserId
      };
    }
    return defaultFormData;
  });
  
  const [formState, setFormStateState] = useState<FormState>(defaultFormState);
  
  const setFormData = (data: Partial<FormData>) => {
    setFormDataState(prev => ({ ...prev, ...data }));
  };
  
  const setFormState = (state: Partial<FormState>) => {
    setFormStateState(prev => ({ ...prev, ...state }));
  };
  
  const resetForm = () => {
    // Keep the userId and userName when resetting
    const { userId, userName } = formData;
    setFormDataState({ 
      ...defaultFormData, 
      userId, 
      userName, 
      sessionDate: new Date().toISOString().split('T')[0] 
    });
    setFormStateState({
      ...defaultFormState,
      isUserVerified: true  // Keep the user verified
    });
  };
  
  return (
    <ShiftFormContext.Provider value={{ formData, formState, setFormData, setFormState, resetForm }}>
      {children}
    </ShiftFormContext.Provider>
  );
}

export function useShiftForm() {
  const context = useContext(ShiftFormContext);
  if (context === undefined) {
    throw new Error('useShiftForm must be used within a ShiftFormProvider');
  }
  return context;
}
