import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ChevronRight, ChevronLeft, FileText, Shield, Heart, AlertTriangle, Upload, Clipboard } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { appointmentAPI, serviceAPI, Service } from '../services/api';
import { TIME_SLOTS } from '../data/mockData';
import { toast } from 'sonner';

type Step = 'category' | 'service' | 'datetime' | 'details';

interface AppointmentDetailsForm {
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
}

const SERVICE_CATEGORIES = [
  {
    id: 'certifications',
    name: 'Certifications & Documents',
    description: 'General government document requests and certifications',
    icon: Clipboard,
    requiredDocuments: [
      'Valid Government-issued ID',
      'Proof of Address',
      'Birth Certificate (for civil registry documents)',
      'Previous version of document (if applicable)'
    ],
    services: [
      'Certificate of Residency',
      'Business Permit Request',
      'Community Tax Certificate (Cedula)',
      'Barangay Clearance for Business'
    ]
  },
  {
    id: 'public-safety',
    name: 'Public Safety',
    description: 'Documents issued by agencies such as the Philippine National Police and Bureau of Fire Protection',
    icon: Shield,
    requiredDocuments: [
      'Valid Government-issued ID',
      'Barangay Clearance',
      'Community Tax Certificate (Cedula)',
      'Passport-sized photo (2x2)'
    ],
    services: [
      'Police Clearance',
      'NBI Clearance',
      'Barangay Clearance',
      'Fire Safety Inspection Certificate',
      'Certificate of No Criminal Record'
    ]
  },
  {
    id: 'health-social',
    name: 'Health & Social Welfare',
    description: 'Programs and records handled by the Department of Health and Department of Social Welfare and Development',
    icon: Heart,
    requiredDocuments: [
      'Valid Government-issued ID',
      'PhilHealth ID or MDR',
      'Medical Certificate (if applicable)',
      'Proof of Income or Financial Statement'
    ],
    services: [
      'Medical Certificate',
      'PWD ID / Certification',
      'Senior Citizen ID',
      'PhilHealth Member Data Record (MDR)',
      'Indigency Certificate'
    ]
  },
  {
    id: 'civil-registry',
    name: 'Civil Registry',
    description: 'Official personal records issued by the Philippine Statistics Authority',
    icon: FileText,
    requiredDocuments: [
      'Valid Government-issued ID',
      'Original Birth/Marriage/Death Record',
      'Proof of relationship to the registrant',
      'Payment receipt'
    ],
    services: [
      'Birth Certificate',
      'Marriage Certificate',
      'Death Certificate',
      'Certificate of No Marriage (CENOMAR)',
      'Advisory on Marriages'
    ]
  },
  {
    id: 'community',
    name: 'Disaster & Community Services',
    description: 'Services handled by Local Government Units (LGUs) and National Disaster Risk Reduction and Management Council',
    icon: AlertTriangle,
    requiredDocuments: [
      'Valid Government-issued ID',
      'Barangay Certificate of Residency',
      'Proof of Calamity/Disaster Impact (if applicable)',
      'Family Composition Form'
    ],
    services: [
      'Calamity Victim Certification',
      'Disaster Assistance Certificate',
      'Damage Assessment Report',
      'Relief Assistance Claim Form',
      'Evacuation Center Certification'
    ]
  },
];

export function BookAppointmentPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formData, setFormData] = useState<AppointmentDetailsForm | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AppointmentDetailsForm>();

  // Load services on mount
  useEffect(() => {
    const loadServices = async () => {
      try {
        const data = await serviceAPI.getAll();
        setServices(data);
      } catch (error) {
        toast.error('Failed to load services');
      }
    };
    loadServices();
  }, []);

  // Load booked time slots when date is selected
  useEffect(() => {
    if (selectedDate && selectedService) {
      const loadBookedSlots = async () => {
        try {
          // Fetch appointments for the selected date and service
          const appointments = await appointmentAPI.getAll();
          const bookedTimes = appointments
            .filter((apt) => apt.date === selectedDate && apt.serviceId === selectedService)
            .map((apt) => apt.time);
          setBookedSlots(bookedTimes);
        } catch (error) {
          console.error('Failed to load booked slots');
        }
      };
      loadBookedSlots();
    }
  }, [selectedDate, selectedService]);

  const steps: { key: Step; label: string }[] = [
    { key: 'category', label: 'Category' },
    { key: 'service', label: 'Service' },
    { key: 'datetime', label: 'Date & Time' },
    { key: 'details', label: 'Details' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].key);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].key);
    }
  };

  const onSubmit = async (data: AppointmentDetailsForm) => {
    setLoading(true);
    try {
      const appointment = await appointmentAPI.create({
        serviceId: selectedService,
        date: selectedDate,
        time: selectedTime,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
      });
      
      toast.success('Appointment booked successfully!');
      navigate(`/confirmation/${appointment.trackingNumber}`, {
        state: {
          service: selectedService,
          date: selectedDate,
          time: selectedTime,
          trackingNumber: appointment.trackingNumber
        }
      });
    } catch (error) {
      toast.error('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'category':
        return selectedCategory !== '';
      case 'service':
        return selectedService !== '';
      case 'datetime':
        return selectedDate !== '' && selectedTime !== '';
      default:
        return false;
    }
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isPast = date < today;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      days.push({
        day,
        date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        disabled: isPast || isWeekend
      });
    }

    return days;
  };

  const selectedCategoryData = SERVICE_CATEGORIES.find(cat => cat.id === selectedCategory);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl text-[var(--gov-secondary)] mb-2">Book an Appointment</h1>
          <p className="text-gray-600">Schedule your appointment with government services</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const isActive = currentStepIndex === index;
            const isCompleted = currentStepIndex > index;

            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 text-lg font-semibold ${
                      isActive
                        ? 'bg-[var(--gov-primary)] text-white'
                        : isCompleted
                        ? 'bg-[var(--gov-primary)] text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className={`text-sm ${isActive ? 'text-[var(--gov-primary)] font-medium' : 'text-gray-600'}`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 flex-1 ${isCompleted ? 'bg-[var(--gov-primary)]' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <Card className="p-8">
          {currentStep === 'category' && (
            <div className="space-y-6">
              <h2 className="text-2xl text-[var(--gov-secondary)]">Select Service Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SERVICE_CATEGORIES.map(category => {
                  const Icon = category.icon;
                  return (
                    <div
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                      }}
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedCategory === category.id
                          ? 'border-[var(--gov-primary)] bg-[var(--gov-accent)]'
                          : 'border-gray-200 hover:border-[var(--gov-primary)] hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={40} className="text-[var(--gov-primary)] mb-4" />
                      <h3 className="text-xl text-[var(--gov-secondary)] mb-2">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 'service' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl text-[var(--gov-secondary)]">Select a Service</h2>
                {selectedCategoryData && (
                  <p className="text-gray-600 mt-2">{selectedCategoryData.description}</p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4">
                {selectedCategoryData?.services.map((serviceName, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedService(serviceName)}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedService === serviceName
                        ? 'border-[var(--gov-primary)] bg-[var(--gov-accent)]'
                        : 'border-gray-200 hover:border-[var(--gov-primary)] hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg text-[var(--gov-secondary)] mb-1">{serviceName}</h3>
                        <p className="text-sm text-gray-600">Government service request</p>
                      </div>
                      {selectedService === serviceName && (
                        <div className="flex items-center gap-2 text-[var(--gov-primary)]">
                          <span className="text-sm font-medium">Selected</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'datetime' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl text-[var(--gov-secondary)] mb-6">Choose Date & Time</h2>
                
                {/* Date Selection */}
                <div className="mb-8">
                  <h3 className="text-lg text-[var(--gov-secondary)] mb-4">Select Date</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="text-center mb-4">
                      <h3 className="text-lg text-[var(--gov-secondary)]">March 2026</h3>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-sm text-gray-600 py-2">{day}</div>
                      ))}
                      {generateCalendarDays().map((dayInfo, index) => {
                        if (!dayInfo) {
                          return <div key={`empty-${index}`} />;
                        }
                        const isSelected = selectedDate === dayInfo.date;
                        return (
                          <button
                            key={dayInfo.date}
                            disabled={dayInfo.disabled}
                            onClick={() => setSelectedDate(dayInfo.date)}
                            className={`py-3 rounded-lg text-sm transition-all ${
                              dayInfo.disabled
                                ? 'text-gray-300 cursor-not-allowed'
                                : isSelected
                                ? 'bg-[var(--gov-primary)] text-white'
                                : 'hover:bg-[var(--gov-accent)]'
                            }`}
                          >
                            {dayInfo.day}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-4 text-center">
                      * Weekends are not available for appointments
                    </p>
                  </div>
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <div>
                    <h3 className="text-lg text-[var(--gov-secondary)] mb-4">Select Time Slot</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {TIME_SLOTS.map(slot => {
                        const isBooked = bookedSlots.includes(slot.time);
                        const isAvailable = slot.available && !isBooked;
                        
                        return (
                          <button
                            key={slot.time}
                            disabled={!isAvailable}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`p-4 rounded-lg border-2 transition-all text-center ${
                              !isAvailable
                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                : selectedTime === slot.time
                                ? 'border-[var(--gov-primary)] bg-[var(--gov-accent)] text-[var(--gov-secondary)]'
                                : 'border-gray-200 hover:border-[var(--gov-primary)]'
                            }`}
                          >
                            <p className="text-center font-medium">{slot.time}</p>
                            {isBooked && <p className="text-xs text-center mt-1">Booked</p>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 'details' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <h2 className="text-2xl text-[var(--gov-secondary)]">Your Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="Juan Dela Cruz"
                    {...register('fullName', { required: 'Full name is required' })}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-600">{errors.fullName.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="juan@example.com"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="09123456789"
                    {...register('phone', {
                      required: 'Phone number is required',
                      pattern: {
                        value: /^[0-9]{10,11}$/,
                        message: 'Invalid phone number',
                      },
                    })}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="City, Province"
                    {...register('address')}
                  />
                </div>
              </div>
              
              {/* Category-specific Required Documents */}
              {selectedCategoryData && (
                <div className="space-y-3">
                  <Label>Required Documents for {selectedCategoryData.name}</Label>
                  <div className="bg-[var(--gov-highlight)] p-4 rounded-lg">
                    <p className="text-sm text-[var(--gov-secondary)] mb-3 font-medium">Please prepare the following documents:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {selectedCategoryData.requiredDocuments.map((doc, index) => (
                        <li key={index}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                    <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PDF, JPG, PNG (max 5MB)</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  rows={4}
                  placeholder="Any additional information..."
                  {...register('notes')}
                />
              </div>

              <div className="bg-[var(--gov-accent)] p-6 rounded-lg border border-[var(--gov-primary)]">
                <h3 className="text-lg text-[var(--gov-secondary)] mb-3 font-semibold">Appointment Summary</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Category:</strong> {selectedCategoryData?.name}</p>
                  <p><strong>Service:</strong> {selectedService}</p>
                  <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p><strong>Time:</strong> {selectedTime}</p>
                </div>
              </div>
            </form>
          )}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            className="min-w-[120px]"
          >
            <ChevronLeft size={20} />
            Back
          </Button>
          
          {currentStep === 'details' ? (
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={loading}
              className="bg-[var(--gov-primary)] hover:bg-[var(--gov-primary)]/90 min-w-[180px]"
            >
              {loading ? 'Submitting...' : 'Submit Appointment'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-[var(--gov-primary)] hover:bg-[var(--gov-primary)]/90 min-w-[120px]"
            >
              Next
              <ChevronRight size={20} />
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}