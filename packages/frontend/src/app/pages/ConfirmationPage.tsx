import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, MapPin, FileText, Eye } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export function ConfirmationPage() {
  const { trackingNumber } = useParams();
  const location = useLocation();
  const appointmentData = location.state;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          <h1 className="text-3xl text-[var(--gov-secondary)] mb-2">
            Appointment Booked Successfully!
          </h1>
          <p className="text-gray-600 mb-6">
            Your appointment request has been submitted and is pending approval
          </p>

          <div className="bg-[var(--gov-highlight)] rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">Tracking Number</p>
            <h2 className="text-2xl text-[var(--gov-primary)]">{trackingNumber}</h2>
            <p className="text-xs text-gray-500 mt-2">
              Save this number to track your appointment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="flex items-start gap-3">
              <FileText className="text-[var(--gov-primary)] mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-600">Service</p>
                <p className="text-[var(--gov-secondary)]">{appointmentData?.service}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="text-[var(--gov-primary)] mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="text-[var(--gov-secondary)]">
                  {appointmentData?.date ? new Date(appointmentData.date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="text-[var(--gov-primary)] mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="text-[var(--gov-secondary)]">{appointmentData?.time}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="text-[var(--gov-primary)] mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-600">Office Location</p>
                <p className="text-[var(--gov-secondary)]">City Hall, Main Office</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg text-[var(--gov-secondary)] mb-3">Important Instructions</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-[var(--gov-primary)] mt-1">•</span>
              <span>Please wait for confirmation email before visiting the office</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--gov-primary)] mt-1">•</span>
              <span>Bring all required documents on your appointment date</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--gov-primary)] mt-1">•</span>
              <span>Arrive at least 15 minutes before your scheduled time</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--gov-primary)] mt-1">•</span>
              <span>Present your tracking number and valid ID upon arrival</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--gov-primary)] mt-1">•</span>
              <span>If you need to reschedule, please do so at least 24 hours in advance</span>
            </li>
          </ul>
        </Card>

        <div className="flex justify-center">
          <Link to="/appointments" className="block w-full md:w-auto md:min-w-[300px]">
            <Button variant="primary" className="w-full justify-center">
              <Eye size={20} />
              View My Appointments
            </Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}