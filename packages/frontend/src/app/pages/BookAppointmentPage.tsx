import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ChevronRight, ChevronLeft, FileText, Shield, Heart,
  AlertTriangle, Upload, Clipboard, ChevronDown,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { appointmentAPI } from '../services/api';
import { toast } from 'sonner';

type Step = 'category' | 'service' | 'datetime' | 'details';

interface AppointmentDetailsForm {
  fullName: string;
  email: string;
  phone: string;
  address: string;
}

const TIME_SLOTS = [
  { time: '8:00 AM', available: true },
  { time: '9:00 AM', available: true },
  { time: '10:00 AM', available: true },
  { time: '11:00 AM', available: true },
  { time: '1:00 PM', available: true },
  { time: '2:00 PM', available: true },
  { time: '3:00 PM', available: true },
  { time: '4:00 PM', available: true },
];

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
      'Previous version of document (if applicable)',
    ],
    services: [
      'Certificate of Residency',
      'Business Permit Request',
      'Community Tax Certificate (Cedula)',
      'Barangay Clearance for Business',
    ],
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
      'Passport-sized photo (2x2)',
    ],
    services: [
      'Police Clearance',
      'NBI Clearance',
      'Barangay Clearance',
      'Fire Safety Inspection Certificate',
      'Certificate of No Criminal Record',
    ],
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
      'Proof of Income or Financial Statement',
    ],
    services: [
      'Medical Certificate',
      'PWD ID / Certification',
      'Senior Citizen ID',
      'PhilHealth Member Data Record (MDR)',
      'Indigency Certificate',
    ],
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
      'Payment receipt',
    ],
    services: [
      'Birth Certificate',
      'Marriage Certificate',
      'Death Certificate',
      'Certificate of No Marriage (CENOMAR)',
      'Advisory on Marriages',
    ],
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
      'Family Composition Form',
    ],
    services: [
      'Calamity Victim Certification',
      'Disaster Assistance Certificate',
      'Damage Assessment Report',
      'Relief Assistance Claim Form',
      'Evacuation Center Certification',
    ],
  },
];

export function BookAppointmentPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AppointmentDetailsForm>();

  // Load booked time slots when date + service are selected
  useEffect(() => {
    if (selectedDate && selectedService) {
      const loadBookedSlots = async () => {
        try {
          const appointments = await appointmentAPI.getAll({ serviceId: selectedService });
          const bookedTimes = appointments
            .filter(apt => {
              const aptDate = new Date(apt.dateTime);
              const aptDateStr = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}-${String(aptDate.getDate()).padStart(2, '0')}`;
              return aptDateStr === selectedDate;
            })
            .map(apt => {
              const d = new Date(apt.dateTime);
              return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            });
          setBookedSlots(bookedTimes);
        } catch {
          console.error('Failed to load booked slots');
        }
      };
      loadBookedSlots();
    }
  }, [selectedDate, selectedService]);

  const steps: { key: Step; label: string }[] = [
    { key: 'category', label: 'Category' },
    { key: 'service',  label: 'Service' },
    { key: 'datetime', label: 'Date & Time' },
    { key: 'details',  label: 'Details' },
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

  const canProceed = () => {
    switch (currentStep) {
      case 'category': return selectedCategory !== '';
      case 'service':  return selectedService !== '';
      case 'datetime': return selectedDate !== '' && selectedTime !== '';
      default:         return false;
    }
  };

  const onSubmit = async (data: AppointmentDetailsForm) => {
    setLoading(true);
    try {
      // Build ISO dateTime from selected date + time
      const timeParts = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      let hours = parseInt(timeParts![1]);
      const minutes = parseInt(timeParts![2]);
      const ampm = timeParts![3].toUpperCase();
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      const dateTime = `${selectedDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

      const [firstName, ...lastParts] = data.fullName.split(' ');
      const lastName = lastParts.join(' ') || firstName;

      const appointment = await appointmentAPI.create({
        serviceId: selectedService,
        dateTime,
        personalDetails: {
          firstName,
          lastName,
          phoneNumber: data.phone,
          email: data.email,
          address: data.address,
        },
      });
      toast.success('Appointment booked successfully!');
      navigate(`/confirmation/${appointment.trackingNumber}`, {
        state: {
          service: selectedService,
          date: selectedDate,
          time: selectedTime,
          trackingNumber: appointment.trackingNumber,
        },
      });
    } catch {
      toast.error('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calendar helpers
  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days: (null | { day: number; date: string; disabled: boolean })[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      days.push({
        day,
        date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        disabled: isPast || isWeekend,
      });
    }
    return days;
  };

  const selectedCategoryData = SERVICE_CATEGORIES.find(c => c.id === selectedCategory);

  // Breadcrumb shown on service + confirm steps
  const Breadcrumb = () => (
    <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
      <button
        onClick={() => setCurrentStep('category')}
        className="hover:text-[var(--gov-primary)] transition-colors"
      >
        Select Service Category
      </button>
      <ChevronRight size={14} className="text-gray-400" />
      <span className="text-[var(--gov-secondary)] font-medium">
        {selectedCategoryData?.name ?? ''}
      </span>
    </nav>
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl text-[var(--gov-secondary)] mb-1">Book an Appointment</h1>
          <p className="text-gray-500">Schedule your appointment with government services</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center">
          {steps.map((step, index) => {
            const isActive    = currentStepIndex === index;
            const isCompleted = currentStepIndex > index;
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 text-sm font-semibold transition-colors ${
                      isActive || isCompleted
                        ? 'bg-[var(--gov-primary)] text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className={`text-xs ${isActive ? 'text-[var(--gov-primary)] font-medium' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mb-4 transition-colors ${isCompleted ? 'bg-[var(--gov-primary)]' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── STEP 1: Select Category ── */}
        {currentStep === 'category' && (
          <Card className="p-8">
            <h2 className="text-xl font-semibold text-[var(--gov-secondary)] mb-6">
              Select Service Category
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SERVICE_CATEGORIES.map(category => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`text-left p-5 rounded-xl border-2 transition-all focus:outline-none ${
                      isSelected
                        ? 'border-[var(--gov-primary)] bg-[var(--gov-primary)]/5'
                        : 'border-gray-200 hover:border-[var(--gov-primary)]/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                      isSelected ? 'bg-[var(--gov-primary)]/15' : 'bg-gray-100'
                    }`}>
                      <Icon size={22} className={isSelected ? 'text-[var(--gov-primary)]' : 'text-gray-500'} />
                    </div>
                    <h3 className={`font-semibold mb-1 ${isSelected ? 'text-[var(--gov-primary)]' : 'text-[var(--gov-secondary)]'}`}>
                      {category.name}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{category.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end mt-8">
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-[var(--gov-primary)] hover:bg-[var(--gov-primary)]/90 min-w-[120px]"
              >
                Next <ChevronRight size={18} />
              </Button>
            </div>
          </Card>
        )}

        {/* ── STEP 2: Select Service (expands inline to show required docs) ── */}
        {currentStep === 'service' && (
          <Card className="p-8">
            <Breadcrumb />
            <h2 className="text-xl font-semibold text-[var(--gov-secondary)] mb-6">
              Select a Service
            </h2>
            <div className="space-y-3">
              {selectedCategoryData?.services.map(serviceName => {
                const isSelected = selectedService === serviceName;
                return (
                  <div
                    key={serviceName}
                    className={`rounded-xl border-2 overflow-hidden transition-all ${
                      isSelected ? 'border-[var(--gov-primary)]' : 'border-gray-200 hover:border-[var(--gov-primary)]/50'
                    }`}
                  >
                    {/* Card header row */}
                    <button
                      onClick={() => setSelectedService(serviceName)}
                      className="w-full text-left flex items-center focus:outline-none"
                    >
                      {/* Left accent bar */}
                      <div className={`w-1 self-stretch flex-shrink-0 ${
                        isSelected ? 'bg-[var(--gov-primary)]' : 'bg-gray-200'
                      }`} />
                      <div className="flex-1 px-5 py-4">
                        <p className={`font-medium ${isSelected ? 'text-[var(--gov-primary)]' : 'text-[var(--gov-secondary)]'}`}>
                          {serviceName}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Government service request</p>
                      </div>
                      <div className="pr-4">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-[var(--gov-primary)] flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <ChevronDown size={16} className="text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Inline expanded: required documents */}
                    {isSelected && selectedCategoryData && (
                      <div className="mx-4 mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                        <p className="text-xs font-semibold text-yellow-800 mb-2 uppercase tracking-wide">
                          Required documents:
                        </p>
                        <ul className="space-y-1">
                          {selectedCategoryData.requiredDocuments.map((doc, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-yellow-900">
                              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-yellow-600 flex-shrink-0" />
                              {doc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={handleBack} className="min-w-[100px]">
                <ChevronLeft size={18} /> Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-[var(--gov-primary)] hover:bg-[var(--gov-primary)]/90 min-w-[120px]"
              >
                Next <ChevronRight size={18} />
              </Button>
            </div>
          </Card>
        )}

        {/* ── STEP 4: Date & Time ── */}
        {currentStep === 'datetime' && (
          <Card className="p-8 space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-[var(--gov-secondary)] mb-6">Choose Date & Time</h2>

              {/* Date picker */}
              <div className="mb-8">
                <h3 className="text-base font-medium text-[var(--gov-secondary)] mb-4">Select Date</h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="text-center mb-4">
                    <p className="text-base font-medium text-[var(--gov-secondary)]">
                      {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className="text-xs text-gray-500 py-2">{d}</div>
                    ))}
                    {generateCalendarDays().map((dayInfo, index) => {
                      if (!dayInfo) return <div key={`empty-${index}`} />;
                      const isSelected = selectedDate === dayInfo.date;
                      return (
                        <button
                          key={dayInfo.date}
                          disabled={dayInfo.disabled}
                          onClick={() => setSelectedDate(dayInfo.date)}
                          className={`py-2.5 rounded-lg text-sm transition-all ${
                            dayInfo.disabled
                              ? 'text-gray-300 cursor-not-allowed'
                              : isSelected
                              ? 'bg-[var(--gov-primary)] text-white font-semibold'
                              : 'hover:bg-[var(--gov-primary)]/10 text-gray-700'
                          }`}
                        >
                          {dayInfo.day}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-4 text-center">
                    * Weekends are not available for appointments
                  </p>
                </div>
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div>
                  <h3 className="text-base font-medium text-[var(--gov-secondary)] mb-4">Select Time Slot</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {TIME_SLOTS.map(slot => {
                      const isBooked = bookedSlots.includes(slot.time);
                      const isAvailable = slot.available && !isBooked;
                      return (
                        <button
                          key={slot.time}
                          disabled={!isAvailable}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`p-3 rounded-lg border-2 text-sm transition-all ${
                            !isAvailable
                              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                              : selectedTime === slot.time
                              ? 'border-[var(--gov-primary)] bg-[var(--gov-primary)]/10 text-[var(--gov-secondary)] font-semibold'
                              : 'border-gray-200 hover:border-[var(--gov-primary)]/50 text-gray-700'
                          }`}
                        >
                          {slot.time}
                          {isBooked && <span className="block text-xs text-gray-400 mt-0.5">Booked</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack} className="min-w-[100px]">
                <ChevronLeft size={18} /> Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-[var(--gov-primary)] hover:bg-[var(--gov-primary)]/90 min-w-[120px]"
              >
                Next <ChevronRight size={18} />
              </Button>
            </div>
          </Card>
        )}

        {/* ── STEP 4: Details ── */}
        {currentStep === 'details' && (
          <Card className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

              {/* Your Information */}
              <div>
                <h2 className="text-xl font-semibold text-[var(--gov-secondary)] mb-5">Your Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="e.g. Juan C. Dela Cruz"
                      {...register('fullName', { required: 'Full name is required' })}
                    />
                    {errors.fullName && <p className="text-xs text-red-600">{errors.fullName.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g. juan.delacruz@gmail.com"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' },
                      })}
                    />
                    {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="e.g. 09123456789"
                      {...register('phone', {
                        required: 'Phone number is required',
                        pattern: { value: /^[0-9]{10,11}$/, message: 'Invalid phone number' },
                      })}
                    />
                    {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      placeholder="City, Province"
                      {...register('address', { required: 'Address is required' })}
                    />
                    {errors.address && <p className="text-xs text-red-600">{errors.address.message}</p>}
                  </div>
                </div>
              </div>

              {/* Required Documents */}
              {selectedCategoryData && (
                <div>
                  <h2 className="text-xl font-semibold text-[var(--gov-secondary)] mb-5">
                    Required documents for {selectedService}
                  </h2>
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    {selectedCategoryData.requiredDocuments.map((doc, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between px-5 py-3.5 ${
                          i < selectedCategoryData.requiredDocuments.length - 1
                            ? 'border-b border-gray-100'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 text-sm text-gray-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--gov-primary)] flex-shrink-0" />
                          {doc}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1.5 text-xs border-gray-300 text-gray-600 hover:border-[var(--gov-primary)] hover:text-[var(--gov-primary)]"
                        >
                          <Upload size={13} />
                          Upload
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appointment Summary */}
              <div className="bg-[var(--gov-primary)]/10 border border-[var(--gov-primary)]/30 rounded-xl p-4">
                <p className="text-sm font-bold text-[var(--gov-secondary)] mb-3">Appointment Summary</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                  <div>
                    <span className="text-gray-500">Category</span>
                    <p className="font-medium text-[var(--gov-secondary)]">{selectedCategoryData?.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Service</span>
                    <p className="font-medium text-[var(--gov-secondary)]">{selectedService}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Date</span>
                    <p className="font-medium text-[var(--gov-secondary)]">
                      {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Time</span>
                    <p className="font-medium text-[var(--gov-secondary)]">{selectedTime}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-1">
                <Button type="button" variant="outline" onClick={handleBack} className="min-w-[100px]">
                  <ChevronLeft size={18} /> Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[var(--gov-primary)] hover:bg-[var(--gov-primary)]/90 min-w-[180px]"
                >
                  {loading ? 'Submitting...' : 'Submit Appointment'}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
