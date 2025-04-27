import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useShiftForm, ShiftType } from "@/context/ShiftFormContext";
import { useEffect } from "react";

interface ShiftTypeFieldsProps {
  shiftType: ShiftType;
}

export default function ShiftTypeFields({ shiftType }: ShiftTypeFieldsProps) {
  const { formData, setFormData } = useShiftForm();
  
  const form = useForm({
    defaultValues: {
      // Complete Healthcare fields
      casesHandled: formData.casesHandled || '',
      screenshotsSent: formData.screenshotsSent || false,
      
      // Trio Project fields
      trioCasesHandled: formData.trioCasesHandled || '',
      macabiTasks: formData.macabiTasks || '',
      shiftQuality: formData.shiftQuality || "4",
      
      // Demo fields
      demoCasesHandled: formData.demoCasesHandled || '',
      demoOrder: formData.demoOrder || "1",
      communicationClarity: formData.communicationClarity || "4",
      communicationPleasantness: formData.communicationPleasantness || "4",
      demoScreenshotsSent: formData.demoScreenshotsSent || false,
      
      // Training fields
      trainingOrder: formData.trainingOrder || "1",
      trainingQuality: formData.trainingQuality || "4"
    }
  });
  
  // Sync form data with context when shiftType changes
  useEffect(() => {
    form.reset({
      // Complete Healthcare fields
      casesHandled: formData.casesHandled || '',
      screenshotsSent: formData.screenshotsSent || false,
      
      // Trio Project fields
      trioCasesHandled: formData.trioCasesHandled || '',
      macabiTasks: formData.macabiTasks || '',
      shiftQuality: formData.shiftQuality || "4",
      
      // Demo fields
      demoCasesHandled: formData.demoCasesHandled || '',
      demoOrder: formData.demoOrder || "1",
      communicationClarity: formData.communicationClarity || "4",
      communicationPleasantness: formData.communicationPleasantness || "4",
      demoScreenshotsSent: formData.demoScreenshotsSent || false,
      
      // Training fields
      trainingOrder: formData.trainingOrder || "1",
      trainingQuality: formData.trainingQuality || "4"
    });
  }, [shiftType]);
  
  if (shiftType === "רפואה שלמה") {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-neutral-medium">פרטי משמרת - רפואה שלמה</h2>
        
        <FormField
          control={form.control}
          name="casesHandled"
          render={({ field }) => (
            <FormItem className="mb-6">
              <FormLabel className="block mb-1 font-medium">מספר התיקים שטופלו <span className="text-error">*</span></FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="הזן מספר תיקים"
                  value={field.value === 0 ? '' : field.value}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : parseInt(e.target.value) || 0;
                    field.onChange(value);
                    setFormData({ casesHandled: value === '' ? 0 : value });
                  }}
                  className="border border-neutral-medium rounded-md w-full text-center"
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="screenshotsSent"
          render={({ field }) => (
            <FormItem className="mb-6">
              <FormLabel className="block mb-1 font-medium">האם נשלח קובץ צילומי מסך?</FormLabel>
              <div className="flex items-center mt-1">
                <Checkbox
                  id="screenshotsSent"
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    setFormData({ screenshotsSent: checked as boolean });
                  }}
                  className="w-5 h-5 text-primary focus:ring-primary rounded-md"
                />
                <label htmlFor="screenshotsSent" className="mr-2">כן, נשלחו צילומי מסך</label>
              </div>
            </FormItem>
          )}
        />
      </div>
    );
  }
  
  if (shiftType === "מיזם טריו") {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-neutral-medium">פרטי משמרת - מיזם טריו</h2>
        
        <FormField
          control={form.control}
          name="trioCasesHandled"
          render={({ field }) => (
            <FormItem className="mb-6">
              <FormLabel className="block mb-1 font-medium">מספר תיקים שטופלו <span className="text-error">*</span></FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="הזן מספר תיקים"
                  value={field.value === 0 ? '' : field.value}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : parseInt(e.target.value) || 0;
                    field.onChange(value);
                    setFormData({ trioCasesHandled: value === '' ? 0 : value });
                  }}
                  className="border border-neutral-medium rounded-md w-full text-center"
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="macabiTasks"
          render={({ field }) => (
            <FormItem className="mb-6">
              <FormLabel className="block mb-1 font-medium">משימות במערכת מכבי</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="הזן מספר משימות"
                  value={field.value === 0 ? '' : field.value}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : parseInt(e.target.value) || 0;
                    field.onChange(value);
                    setFormData({ macabiTasks: value === '' ? 0 : value });
                  }}
                  className="border border-neutral-medium rounded-md w-full text-center"
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="shiftQuality"
          render={({ field }) => (
            <FormItem className="mb-6">
              <FormLabel className="block mb-1 font-medium">איכות המשמרת</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setFormData({ shiftQuality: value as "1" | "2" | "3" | "4" });
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full border border-neutral-medium rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="4">4 - מצוין</SelectItem>
                  <SelectItem value="3">3 - טוב</SelectItem>
                  <SelectItem value="2">2 - בינוני</SelectItem>
                  <SelectItem value="1">1 - חלש</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>
    );
  }
  
  if (shiftType === "דמו") {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-neutral-medium">פרטי משמרת - דמו</h2>
        
        <FormField
          control={form.control}
          name="demoCasesHandled"
          render={({ field }) => (
            <FormItem className="mb-6">
              <FormLabel className="block mb-1 font-medium">מספר התיקים שטופלו <span className="text-error">*</span></FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="הזן מספר תיקים"
                  value={field.value === 0 ? '' : field.value}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : parseInt(e.target.value) || 0;
                    field.onChange(value);
                    setFormData({ demoCasesHandled: value === '' ? 0 : value });
                  }}
                  className="border border-neutral-medium rounded-md w-full text-center"
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="demoOrder"
          render={({ field }) => (
            <FormItem className="mb-6">
              <FormLabel className="block mb-1 font-medium">סדר משמרת הדמו</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setFormData({ demoOrder: value as "1" | "2" | "3" | "4" });
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full border border-neutral-medium rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="communicationClarity"
          render={({ field }) => (
            <FormItem className="mb-6">
              <FormLabel className="block mb-1 font-medium">בהירות התקשורת</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setFormData({ communicationClarity: value as "1" | "2" | "3" | "4" });
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full border border-neutral-medium rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="4">4 - מצוין</SelectItem>
                  <SelectItem value="3">3 - טוב</SelectItem>
                  <SelectItem value="2">2 - בינוני</SelectItem>
                  <SelectItem value="1">1 - חלש</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="communicationPleasantness"
          render={({ field }) => (
            <FormItem className="mb-6">
              <FormLabel className="block mb-1 font-medium">נעימות התקשורת</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setFormData({ communicationPleasantness: value as "1" | "2" | "3" | "4" });
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full border border-neutral-medium rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="4">4 - מצוין</SelectItem>
                  <SelectItem value="3">3 - טוב</SelectItem>
                  <SelectItem value="2">2 - בינוני</SelectItem>
                  <SelectItem value="1">1 - חלש</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="demoScreenshotsSent"
          render={({ field }) => (
            <FormItem className="mb-6">
              <FormLabel className="block mb-1 font-medium">האם נשלח קובץ צילומי מסך?</FormLabel>
              <div className="flex items-center mt-1">
                <Checkbox
                  id="demoScreenshotsSent"
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    setFormData({ demoScreenshotsSent: checked as boolean });
                  }}
                  className="w-5 h-5 text-primary focus:ring-primary rounded-md"
                />
                <label htmlFor="demoScreenshotsSent" className="mr-2">כן, נשלחו צילומי מסך</label>
              </div>
            </FormItem>
          )}
        />
      </div>
    );
  }
  
  if (shiftType === "הכשרה") {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-neutral-medium">פרטי משמרת - הכשרה</h2>
        
        <FormField
          control={form.control}
          name="trainingOrder"
          render={({ field }) => (
            <FormItem className="mb-6">
              <FormLabel className="block mb-1 font-medium">סדר משמרת ההכשרה</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setFormData({ trainingOrder: value as "1" | "2" | "3" | "4" });
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full border border-neutral-medium rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="trainingQuality"
          render={({ field }) => (
            <FormItem className="mb-6">
              <FormLabel className="block mb-1 font-medium">איכות ההדרכה</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setFormData({ trainingQuality: value as "1" | "2" | "3" | "4" });
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full border border-neutral-medium rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="4">4 - מצוין</SelectItem>
                  <SelectItem value="3">3 - טוב</SelectItem>
                  <SelectItem value="2">2 - בינוני</SelectItem>
                  <SelectItem value="1">1 - חלש</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>
    );
  }
  
  return null;
}