import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useShiftForm } from "../context/ShiftFormContext";

interface UserIdentificationProps {
  userId: string;
  onUserIdChange: (value: string) => void;
  onVerify: () => void;
  isVerifying: boolean;
  error: string | null;
  userName: string;
}

export default function UserIdentification({
  userId,
  onUserIdChange,
  onVerify,
  isVerifying,
  error,
  userName
}: UserIdentificationProps) {
  const [changeUserMode, setChangeUserMode] = useState(false);
  const { resetForm } = useShiftForm();
  
  // Load stored user ID from localStorage on initial render
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId && !userId && !changeUserMode) {
      onUserIdChange(storedUserId);
      // Automatically verify the stored user ID
      setTimeout(() => {
        onVerify();
      }, 300);
    }
  }, []);
  
  // Save user ID to localStorage when verified successfully
  useEffect(() => {
    if (userName && userId) {
      localStorage.setItem('userId', userId);
    }
  }, [userName, userId]);
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onVerify();
    }
  };
  
  const handleChangeUser = () => {
    // Clear the stored user ID
    localStorage.removeItem('userId');
    // Reset form state
    resetForm();
    // Switch to change user mode
    setChangeUserMode(true);
    // Clear the current user
    onUserIdChange('');
  };
  
  return (
    <CardContent className="p-4 md:p-6 border-b border-neutral-medium">
      <h2 className="text-xl font-semibold mb-4">זיהוי משתמש</h2>
      
      <div className="mb-4">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-grow">
            <label htmlFor="userId" className="block mb-1 font-medium">מספר תעודת זהות</label>
            <Input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => onUserIdChange(e.target.value)}
              onKeyPress={handleKeyPress}
              dir="ltr"
              placeholder="הזן מספר תעודת זהות"
              className="w-full border border-neutral-medium rounded-md px-3 py-2 h-10 focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={!!userName && !changeUserMode}
            />
            {error && <p className="mt-1 text-error text-sm">{error}</p>}
          </div>
          <div className="md:mb-0 mb-2">
            {(!userName || changeUserMode) && (
              <Button
                onClick={onVerify}
                disabled={isVerifying || !userId}
                className="h-10 px-4 w-full md:w-auto bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    מאמת...
                  </>
                ) : (
                  "אימות"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {userName && !changeUserMode && (
        <div className="mt-4 p-4 bg-neutral-light rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                <span className="text-lg font-bold">{userName.charAt(0)}</span>
              </div>
              <div className="mr-3">
                <p className="font-medium">שלום, <span>{userName}</span></p>
                <p className="text-sm text-neutral-darkest">אותר בהצלחה במערכת</p>
              </div>
            </div>
            <Button
              onClick={handleChangeUser}
              variant="outline"
              className="text-sm border-neutral-medium hover:bg-neutral-light/80"
            >
              החלף משתמש
            </Button>
          </div>
        </div>
      )}
      
      {changeUserMode && (
        <div className="mt-2 text-sm text-neutral-darkest">
          <p>החלפת משתמש תנקה את כל הנתונים שהוזנו בטופס.</p>
        </div>
      )}
    </CardContent>
  );
}
