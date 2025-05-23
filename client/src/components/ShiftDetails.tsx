import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useShiftForm, ShiftType } from "@/context/ShiftFormContext";
import ShiftTypeFields from "./ShiftTypeFields";
import DatePickerStyled from "./DatePickerStyled";
import TimePicker from "./TimePicker";
import { calculateDuration } from "@/utils/timeUtils";
import { fetchDoctorsByType, fetchInstructors } from "@/utils/googleSheetsUpdated";

const formSchema = z.object({
  shiftType: z.string().min(1, { message: "חובה לבחור סוג משמרת" }),
  doctorName: z.string().optional(),
  instructorName: z.string().optional(),
  sessionDate: z.string().min(1, { message: "חובה להזין תאריך" }),
  startTime: z.string().min(1, { message: "חובה להזין שעת התחלה" }),
  endTime: z.string().min(1, { message: "חובה להזין שעת סיום" }),
  calculatedDuration: z.string().optional(),
  manualDuration: z.string().optional(),
  location: z.enum(["בית", "מרפאה"]),
  shiftNotes: z.string().optional(),
});

interface ShiftDetailsProps {
  onSubmit: () => void;
}

export default function ShiftDetails({ onSubmit }: ShiftDetailsProps) {
  const { formData, setFormData, formState, setFormState } = useShiftForm();
  const [doctorSearchText, setDoctorSearchText] = useState("");
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shiftType: formData.shiftType,
      doctorName: formData.doctorName,
      instructorName: formData.instructorName,
      sessionDate: formData.sessionDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      calculatedDuration: formData.calculatedDuration,
      manualDuration: formData.manualDuration,
      location: formData.location,
      shiftNotes: formData.shiftNotes,
    },
  });

  // Keep form state in sync with context data
  useEffect(() => {
    form.reset({
      shiftType: formData.shiftType,
      doctorName: formData.doctorName,
      instructorName: formData.instructorName,
      sessionDate: formData.sessionDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      calculatedDuration: formData.calculatedDuration,
      manualDuration: formData.manualDuration,
      location: formData.location,
      shiftNotes: formData.shiftNotes,
    });
  }, [formData.shiftType]);

  // Set today's date as default
  useEffect(() => {
    if (!formData.sessionDate) {
      const today = new Date().toISOString().split('T')[0];
      setFormData({ sessionDate: today });
    }
  }, []);

  // Calculate shift duration when start or end time changes
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      try {
        // Use our improved calculateDuration function
        const duration = calculateDuration(formData.startTime, formData.endTime);
        
        // Update the form data with the calculated duration
        setFormData({ calculatedDuration: duration });
        
        // Update form's calculated duration field
        form.setValue("calculatedDuration", duration);
      } catch (error) {
        console.error("Error calculating duration:", error);
      }
    }
  }, [formData.startTime, formData.endTime]);

  // Load doctor options when shift type changes
  useEffect(() => {
    if (formData.shiftType && formData.shiftType !== "הכשרה") {
      loadDoctorOptions(formData.shiftType);
    } else if (formData.shiftType === "הכשרה") {
      loadInstructorOptions();
    }
  }, [formData.shiftType]);

  const loadDoctorOptions = async (shiftType: string) => {
    try {
      setFormState({ 
        doctorOptions: [],
        showAutocomplete: false
      });
      
      const doctors = await fetchDoctorsByType(shiftType);
      
      setFormState({ 
        doctorOptions: doctors,
        showAutocomplete: true
      });
    } catch (error) {
      console.error("Error loading doctor options:", error);
    }
  };
  
  const loadInstructorOptions = async () => {
    try {
      setFormState({ 
        doctorOptions: [],
        showAutocomplete: false
      });
      
      const instructors = await fetchInstructors();
      
      setFormState({ 
        doctorOptions: instructors,
        showAutocomplete: true
      });
    } catch (error) {
      console.error("Error loading instructor options:", error);
    }
  };

  const handleShiftTypeChange = (value: string) => {
    setFormData({ 
      shiftType: value as ShiftType,
      doctorName: "", // Reset doctor name when shift type changes
      instructorName: ""
    });
  };

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    // Update form data in context
    setFormData({
      ...values,
      shiftType: values.shiftType as ShiftType,
    });
    
    // Call the parent submit handler
    onSubmit();
  };

  const handleDoctorSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchText = e.target.value;
    setDoctorSearchText(searchText);
    setFormData({ doctorName: searchText });
    
    // Show autocomplete if we have search text and options
    setFormState({ 
      showAutocomplete: searchText.length > 0 && formState.doctorOptions.length > 0 
    });
  };

  const handleSelectDoctor = (doctorName: string) => {
    setFormData({ doctorName: doctorName });
    setDoctorSearchText(doctorName);
    setFormState({ showAutocomplete: false });
  };

  const filteredDoctors = formState.doctorOptions.filter(doctor => 
    doctor.toLowerCase().includes(doctorSearchText.toLowerCase())
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="p-4 md:p-6 rtl-form">
        {/* Basic Fields (Common to All Shift Types) */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-neutral-medium">פרטי משמרת</h2>
          
          {/* Shift Type Selection */}
          <FormField
            control={form.control}
            name="shiftType"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="block mb-1 font-medium">סוג משמרת <span className="text-error">*</span></FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleShiftTypeChange(value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="w-full border border-neutral-medium rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary">
                      <SelectValue placeholder="בחר סוג משמרת" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="רפואה שלמה">רפואה שלמה</SelectItem>
                    <SelectItem value="מיזם טריו">מיזם טריו</SelectItem>
                    <SelectItem value="דמו">דמו</SelectItem>
                    <SelectItem value="הכשרה">הכשרה</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Doctor/Instructor Name with Autocomplete */}
          {formData.shiftType && formData.shiftType !== "הכשרה" && (
            <div className="mb-6">
              <label htmlFor="doctorName" className="block mb-1 font-medium">שם הרופא <span className="text-error">*</span></label>
              <div className="relative">
                <Input
                  id="doctorName"
                  type="text"
                  value={doctorSearchText || formData.doctorName}
                  onChange={handleDoctorSearch}
                  placeholder="הקלד שם רופא"
                  className="w-full h-10 border border-neutral-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {formState.showAutocomplete && filteredDoctors.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-medium rounded-md shadow-lg">
                    {filteredDoctors.map((doctor, index) => (
                      <div 
                        key={index} 
                        className="p-2 cursor-pointer hover:bg-neutral-light"
                        onClick={() => handleSelectDoctor(doctor)}
                      >
                        {doctor}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Instructor Name Field (for training shift) */}
          {formData.shiftType === "הכשרה" && (
            <FormField
              control={form.control}
              name="instructorName"
              render={({ field }) => (
                <FormItem className="mb-6">
                  <FormLabel className="block mb-1 font-medium">שם המדריך <span className="text-error">*</span></FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="הקלד שם המדריך"
                      className="w-full h-10 border border-neutral-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      onChange={(e) => {
                        field.onChange(e);
                        setFormData({ instructorName: e.target.value });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {/* Session Date - with day/month/year in DD/MM/YYYY format */}
          <FormField
            control={form.control}
            name="sessionDate"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormControl>
                  <DatePickerStyled 
                    label="תאריך הססיה"
                    value={field.value}
                    onChange={(date) => {
                      field.onChange(date);
                      setFormData({ sessionDate: date });
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Start and End Time with Scrollable Hours/Minutes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <TimePicker
                      label="שעת התחלה"
                      value={field.value}
                      onChange={(time) => {
                        field.onChange(time);
                        setFormData({ startTime: time });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <TimePicker
                      label="שעת סיום"
                      value={field.value}
                      onChange={(time) => {
                        field.onChange(time);
                        setFormData({ endTime: time });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Calculated and Manual Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <FormField
              control={form.control}
              name="calculatedDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block mb-1 font-medium">משך משמרת מחושב</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        readOnly
                        className="w-full h-10 border border-neutral-medium rounded-md px-3 py-2 bg-neutral-light"
                      />
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <span className="text-neutral-darkest">⏱️</span>
                      </div>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="manualDuration"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <TimePicker
                      label="משך משמרת ידני (אופציונלי)"
                      value={field.value || ""}
                      onChange={(time) => {
                        field.onChange(time);
                        setFormData({ manualDuration: time });
                      }}
                      required={false}
                      hoursOnly={false}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          {/* Shift Location */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="block mb-1 font-medium">מיקום המשמרת <span className="text-error">*</span></FormLabel>
                <FormControl>
                  <div className="flex flex-col items-end">
                    <RadioGroup
                      dir="rtl"
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setFormData({ location: value as "בית" | "מרפאה" });
                      }}
                      className="w-full flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-end">
                        <label htmlFor="locationHome" className="ml-2">בית</label>
                        <RadioGroupItem value="בית" id="locationHome" className="w-4 h-4 text-primary focus:ring-primary" />
                      </div>
                      <div className="flex items-center justify-end">
                        <label htmlFor="locationClinic" className="ml-2">מרפאה</label>
                        <RadioGroupItem value="מרפאה" id="locationClinic" className="w-4 h-4 text-primary focus:ring-primary" />
                      </div>
                    </RadioGroup>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          

        </div>
        
        {/* Specific Fields for Each Shift Type */}
        {formData.shiftType && (
          <ShiftTypeFields shiftType={formData.shiftType} />
        )}
        
        {/* Shift Notes */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-neutral-medium">הערות</h2>
          <FormField
            control={form.control}
            name="shiftNotes"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="block mb-1 font-medium">הערות למשמרת</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={3}
                    placeholder="הערות נוספות לגבי המשמרת..."
                    className="w-full border border-neutral-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    onChange={(e) => {
                      field.onChange(e);
                      setFormData({ shiftNotes: e.target.value });
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        {/* Form Submission */}
        <div className="flex justify-center mt-8">
          <Button 
            type="submit"
            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-md transition-colors"
            disabled={formState.isFormSubmitting}
          >
            שלח דיווח משמרת
          </Button>
        </div>
      </form>
    </Form>
  );
}
