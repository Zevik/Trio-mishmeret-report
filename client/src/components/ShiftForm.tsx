import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useShiftForm } from "@/context/ShiftFormContext";
import UserIdentification from "./UserIdentification";
import ShiftDetails from "./ShiftDetails";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { submitFormToSheets, fetchUserByIdFromSheet } from "@/utils/googleSheetsUpdated";

export default function ShiftForm() {
  const { formData, formState, setFormData, setFormState, resetForm } = useShiftForm();
  const { toast } = useToast();

  // Check if there's a stored userId on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId && storedUserId === formData.userId && !formState.isUserVerified) {
      // Auto-verify if ID exists and is the same as what's in the form
      handleVerifyUser();
    }
  }, []);

  const handleVerifyUser = async () => {
    if (!formData.userId || formData.userId.length < 5) {
      setFormState({ formError: "מספר תעודת זהות חייב להיות לפחות 5 ספרות" });
      return;
    }

    setFormState({ isFormSubmitting: true, formError: null });

    try {
      // Fetch user data from the "כרטיס רפואן" sheet
      const userResult = await fetchUserByIdFromSheet(formData.userId);
      
      if (userResult) {
        setFormData({ userName: userResult });
        setFormState({ isUserVerified: true });
        
        // Store userId in localStorage for future visits
        localStorage.setItem('userId', formData.userId);
        
        toast({
          title: "משתמש אומת בהצלחה",
          description: `שלום, ${userResult}`,
        });
      } else {
        setFormState({ formError: "מספר תעודת זהות לא נמצא במערכת" });
        toast({
          title: "שגיאה באימות",
          description: "מספר תעודת זהות לא נמצא במערכת",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verifying user:", error);
      setFormState({ 
        formError: "אירעה שגיאה באימות המשתמש. אנא נסה שוב." 
      });
      toast({
        title: "שגיאה באימות",
        description: "אירעה שגיאה בשרת. אנא נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    } finally {
      setFormState({ isFormSubmitting: false });
    }
  };



  const handleSubmitForm = async () => {
    // Form validation
    if (!formData.shiftType) {
      toast({
        title: "שגיאה",
        description: "אנא בחר סוג משמרת",
        variant: "destructive",
      });
      return;
    }

    if (!formData.sessionDate || !formData.startTime || !formData.endTime) {
      toast({
        title: "שגיאה",
        description: "אנא מלא את כל שדות החובה",
        variant: "destructive",
      });
      return;
    }

    // אימות פורמט שעות תקין
    const { isValidTimeFormat, isValidDuration } = await import('@/utils/validation');
    
    // בדיקת שעת התחלה
    if (!isValidTimeFormat(formData.startTime)) {
      toast({
        title: "שגיאה בפורמט שעה",
        description: "שעת התחלה אינה בפורמט תקין. אנא הזן שעה בפורמט 00:00 עד 23:59",
        variant: "destructive",
      });
      return;
    }
    
    // בדיקת שעת סיום
    if (!isValidTimeFormat(formData.endTime)) {
      toast({
        title: "שגיאה בפורמט שעה",
        description: "שעת סיום אינה בפורמט תקין. אנא הזן שעה בפורמט 00:00 עד 23:59",
        variant: "destructive",
      });
      return;
    }
    
    // בדיקת משך ידני (אם הוזן)
    if (formData.manualDuration && !isValidDuration(formData.manualDuration)) {
      toast({
        title: "שגיאה בפורמט שעה",
        description: "משך משמרת ידני אינו בפורמט תקין. אנא הזן שעה בפורמט 00:00 עד 23:59",
        variant: "destructive",
      });
      return;
    }

    if ((formData.shiftType === "הכשרה" && !formData.instructorName) ||
        (formData.shiftType !== "הכשרה" && !formData.doctorName)) {
      toast({
        title: "שגיאה",
        description: "אנא הזן שם רופא או מדריך",
        variant: "destructive",
      });
      return;
    }

    setFormState({ isFormSubmitting: true, formError: null });

    try {
      // Mark if this is a demo request specifically
      const dataToSubmit = formData.shiftType === 'דמו' ? { ...formData, isDemo: true } : formData;
      
      const result = await submitFormToSheets(dataToSubmit);
      setFormState({ isFormSubmitted: true });
      
      // Show warning toast if we're in simulated success mode
      toast({
        title: "הדיווח נשלח בהצלחה",
        description: formData.shiftType === 'דמו' 
          ? "נתוני דמו התקבלו בהצלחה במערכת" 
          : "פרטי המשמרת נשמרו במערכת",
        variant: "default",
      });
      
    } catch (error) {
      console.error("Error submitting form:", error);
      setFormState({ 
        formError: "אירעה שגיאה בשליחת הטופס. אנא נסה שוב." 
      });
      toast({
        title: "שגיאה בשליחה",
        description: "אירעה שגיאה בשליחת הטופס. אנא נסה שוב.",
        variant: "destructive",
      });
    } finally {
      setFormState({ isFormSubmitting: false });
    }
  };

  const handleNewReport = () => {
    resetForm();
    setFormState({ isFormSubmitted: false });
  };

  const handleTryAgain = () => {
    setFormState({ formError: null });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-primary text-white p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-center">כרטיס משמרת</h1>
        <p className="text-center mt-1 text-white/80">מערכת דיווח משמרות</p>
      </div>

      {/* User Identification */}
      {!formState.isUserVerified && (
        <UserIdentification 
          userId={formData.userId}
          onUserIdChange={(value) => setFormData({ userId: value })}
          onVerify={handleVerifyUser}
          isVerifying={formState.isFormSubmitting}
          error={formState.formError}
          userName={formData.userName}
        />
      )}

      {/* Main Form */}
      {formState.isUserVerified && !formState.isFormSubmitted && !formState.formError && (
        <CardContent className="p-0">
          <div className="p-4 md:p-6 bg-neutral-light rounded-md m-4 md:m-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                  <span className="text-lg font-bold">{formData.userName.charAt(0)}</span>
                </div>
                <div className="mr-3">
                  <p className="font-medium">שלום, <span>{formData.userName}</span></p>
                  <p className="text-sm text-neutral-darkest">אותר בהצלחה במערכת</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="text-sm border-neutral-medium hover:bg-neutral-light/80"
                onClick={() => {
                  // Clear local storage
                  localStorage.removeItem('userId');
                  // Reset form
                  resetForm();
                  // Set user as not verified
                  setFormState({ isUserVerified: false });
                  // Clear user data
                  setFormData({ userId: "", userName: "" });
                }}
              >
                החלף משתמש
              </Button>
            </div>
          </div>

          <ShiftDetails onSubmit={handleSubmitForm} />
        </CardContent>
      )}

      {/* Loading Indicator */}
      {formState.isFormSubmitting && (
        <div className="p-6 text-center">
          <div className="inline-block w-8 h-8 border-4 border-neutral-medium border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-neutral-darkest">מעבד את הנתונים...</p>
        </div>
      )}

      {/* Confirmation Message */}
      {formState.isFormSubmitted && (
        <Card className="p-6 bg-primary-light/10 text-center rounded-lg mx-4 md:mx-6 my-4 md:my-6">
          <CardContent className="pt-6">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-4 bg-success/10 rounded-full text-success">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">הדיווח נשלח בהצלחה!</h3>
            <p className="text-neutral-darkest mb-4">
              {formData.shiftType === 'דמו' 
                ? "נתוני משמרת דמו התקבלו בהצלחה במערכת"
                : "פרטי המשמרת נשמרו במערכת"}
            </p>
            
            {/* Simple success message */}
            <Alert className="mb-4 bg-green-50 border-green-200 text-green-700">
              <AlertDescription className="text-sm text-right">
                המשמרת נרשמה בהצלחה.
              </AlertDescription>
            </Alert>
            
            <Button 
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
              onClick={handleNewReport}
            >
              דיווח משמרת חדשה
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {formState.formError && formState.isUserVerified && !formState.isFormSubmitting && (
        <Card className="p-6 bg-error/10 text-center rounded-lg mx-4 md:mx-6 my-4 md:my-6">
          <CardContent className="pt-6">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-4 bg-error/10 rounded-full text-error">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">שגיאה בשליחת הטופס</h3>
            <p className="text-neutral-darkest mb-4">
              {formState.formError || "אירעה שגיאה בעת שליחת הטופס. אנא נסה שוב."}
            </p>
            <Button 
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
              onClick={handleTryAgain}
            >
              נסה שוב
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
