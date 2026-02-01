import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, User, Phone, Mail, MessageSquare, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const appointmentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  age: z.coerce
    .number({ invalid_type_error: "Age must be a number" })
    .min(1, "Age must be at least 1")
    .max(150, "Please enter a valid age"),
  gender: z.enum(["male", "female", "other"], {
    errorMap: () => ({ message: "Please select a gender" }),
  }),
  contactNumber: z
    .string()
    .trim()
    .min(1, "Contact number is required")
    .regex(/^[\d\s\-+()]{7,20}$/, "Please enter a valid phone number"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  problem: z
    .string()
    .trim()
    .min(1, "Please describe your problem")
    .max(1000, "Problem description must be less than 1000 characters"),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

const WEBHOOK_URL = "https://marikanti.app.n8n.cloud/webhook-test/bb35cbc1-b6d2-421c-a42a-3674f0d45483";

interface WebhookResponse {
  message?: string;
  confirmationId?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  doctorName?: string;
  [key: string]: unknown;
}

const AppointmentForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmationData, setConfirmationData] = useState<WebhookResponse | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
  });

  const onSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          age: data.age,
          gender: data.gender,
          contactNumber: data.contactNumber,
          email: data.email,
          problem: data.problem,
          submittedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit appointment");
      }

      // Parse the response from n8n webhook
      const responseData = await response.json();
      setConfirmationData(responseData);
      setIsSuccess(true);
      toast.success("Appointment booked successfully!");
      reset();
    } catch (error) {
      console.error("Webhook error:", error);
      toast.error("Failed to book appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookAnother = () => {
    setIsSuccess(false);
    setConfirmationData(null);
  };

  if (isSuccess) {
    return (
      <div className="bg-card rounded-2xl card-shadow p-8 md:p-12 animate-scale-in">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-6">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-3">
            Appointment Booked!
          </h2>
          
          {/* Display confirmation response from n8n */}
          {confirmationData && (
            <div className="bg-accent/50 rounded-xl p-6 mb-6 text-left">
              <h3 className="font-semibold text-foreground mb-4 text-center">Confirmation Details</h3>
              <div className="space-y-3">
                {confirmationData.message && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-muted-foreground font-medium">Message:</span>
                    <span className="text-foreground">{confirmationData.message}</span>
                  </div>
                )}
                {confirmationData.confirmationId && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-muted-foreground font-medium">Confirmation ID:</span>
                    <span className="text-foreground font-mono">{confirmationData.confirmationId}</span>
                  </div>
                )}
                {confirmationData.appointmentDate && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-muted-foreground font-medium">Date:</span>
                    <span className="text-foreground">{confirmationData.appointmentDate}</span>
                  </div>
                )}
                {confirmationData.appointmentTime && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-muted-foreground font-medium">Time:</span>
                    <span className="text-foreground">{confirmationData.appointmentTime}</span>
                  </div>
                )}
                {confirmationData.doctorName && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-muted-foreground font-medium">Doctor:</span>
                    <span className="text-foreground">{confirmationData.doctorName}</span>
                  </div>
                )}
                {/* Display any other fields from the response */}
                {Object.entries(confirmationData)
                  .filter(([key]) => !['message', 'confirmationId', 'appointmentDate', 'appointmentTime', 'doctorName'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-muted-foreground font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="text-foreground">{String(value)}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
          
          {!confirmationData && (
            <p className="text-muted-foreground text-lg mb-6">
              Your appointment has been booked successfully. We will contact you shortly.
            </p>
          )}
          
          <Button
            variant="medical"
            size="lg"
            onClick={handleBookAnother}
          >
            Book Another Appointment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl card-shadow p-6 md:p-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-accent rounded-xl">
          <Calendar className="w-6 h-6 text-accent-foreground" />
        </div>
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
          Book an Appointment
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2 text-foreground font-medium">
            <User className="w-4 h-4 text-muted-foreground" />
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Enter your full name"
            {...register("name")}
            className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Age and Gender Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="age" className="flex items-center gap-2 text-foreground font-medium">
              Age <span className="text-destructive">*</span>
            </Label>
            <Input
              id="age"
              type="number"
              min="1"
              max="150"
              placeholder="Enter your age"
              {...register("age")}
              className={errors.age ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {errors.age && (
              <p className="text-sm text-destructive">{errors.age.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender" className="flex items-center gap-2 text-foreground font-medium">
              Gender <span className="text-destructive">*</span>
            </Label>
            <Select onValueChange={(value) => setValue("gender", value as "male" | "female" | "other")}>
              <SelectTrigger 
                id="gender"
                className={errors.gender ? "border-destructive focus:ring-destructive" : ""}
              >
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-sm text-destructive">{errors.gender.message}</p>
            )}
          </div>
        </div>

        {/* Contact Number Field */}
        <div className="space-y-2">
          <Label htmlFor="contactNumber" className="flex items-center gap-2 text-foreground font-medium">
            <Phone className="w-4 h-4 text-muted-foreground" />
            Contact Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contactNumber"
            type="tel"
            placeholder="Enter your phone number"
            {...register("contactNumber")}
            className={errors.contactNumber ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.contactNumber && (
            <p className="text-sm text-destructive">{errors.contactNumber.message}</p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2 text-foreground font-medium">
            <Mail className="w-4 h-4 text-muted-foreground" />
            Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            {...register("email")}
            className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Problem Field */}
        <div className="space-y-2">
          <Label htmlFor="problem" className="flex items-center gap-2 text-foreground font-medium">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            What is the Problem? <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="problem"
            placeholder="Please describe your symptoms or health concerns..."
            rows={4}
            {...register("problem")}
            className={errors.problem ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.problem && (
            <p className="text-sm text-destructive">{errors.problem.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="medical"
          size="xl"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Booking Appointment...
            </>
          ) : (
            "Book Appointment"
          )}
        </Button>
      </form>
    </div>
  );
};

export default AppointmentForm;
