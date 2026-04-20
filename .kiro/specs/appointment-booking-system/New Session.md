# New Session

Exported: 4/10/2026, 12:19:48 AM

---

**User:**

Issue 1: API Calling code
Di2 banda are SOME of the conflict sa API 
authAPI.login — should call POST /api/auth/login, but currently does local mock comparison with plaintext passwords (backend uses bcrypt)
authAPI.logout — should call POST /api/auth/logout to hit terminateSession, otherwise the JWT stays valid server-side
appointmentAPI.create — should call POST /api/appointments with a personalDetails JSONB body, not flat fields
serviceAPI.getAll — returns hardcoded mock array; real endpoint will return UUIDs as IDs, not slugs like 'birth-cert'
Ultimately should look like ts 
POST /api/auth/login   → route handler (kung anu man ruta/auth.ts)   → calls authenticate() from services/auth.ts   → returns AuthResult   → route sends { user, token } as JSON response   → frontend LoginResponse maps to that JSON shape

---

**Assistant:**

I can see you're working on a government appointment system and need to fix API calls in the `api.ts` file. Let me first examine the current implementation to understand the issues.



Let me check the active editor file directly since it's already open:



---

**User:**

what are thinsg i can do to absolve these issues
Issue 1: API Calling code
Di2 banda are SOME of the conflict sa API 
authAPI.login — should call POST /api/auth/login, but currently does local mock comparison with plaintext passwords (backend uses bcrypt)
authAPI.logout — should call POST /api/auth/logout to hit terminateSession, otherwise the JWT stays valid server-side
appointmentAPI.create — should call POST /api/appointments with a personalDetails JSONB body, not flat fields
serviceAPI.getAll — returns hardcoded mock array; real endpoint will return UUIDs as IDs, not slugs like 'birth-cert'
Ultimately should look like ts 
POST /api/auth/login   → route handler (kung anu man ruta/auth.ts)   → calls authenticate() from services/auth.ts   → returns AuthResult   → route sends { user, token } as JSON response   → frontend LoginResponse maps to that JSON shape
Issue 2: MISMATCH sa Services
- replace businessHours: string with the ServiceHours object shape, and requiresDocuments: boolean with requiredDocuments: string[].
ito diff
Frontend field	                  Backend equivalent	                                                        Problem businessHours: string	          operatingHours: ServiceHours (startTime, endTime, daysOfWeek, capacity)	  completely different shape requiresDocuments: boolean	      requiredDocuments: string[]	                                              boolean vs. array of document names (missing)	                      duration, capacity, isActive, archivedAt, createdBy	                      frontend is unaware of these
Issue 3: input handling 1. Date and Time format: gamit ni frontend is dis
date: string;   // separate time: string;   // separate
→ Pinagsama na dis sa backend, so before sha ipasa sa backend supposed to be magkasama na 2, it uses ISO datetime string  2. AppointmentFormData: may mistach sa number of fields (kumbaga kulang) -> especialy ung sa files, pamatch nalang ng naming and data format
Frontend Info	        Backend PersonalDetails fullName: string	    firstName: string + lastName: string phone: string	        phoneNumber: string address?: string	    address: string (required) notes?: string	        remarks?: string (missing)	           dateOfBirth, governmentId (required by clients table)
→Split fullName → firstName + lastName
Rename phone → phoneNumber, make address required   
Rename notes → remarks
Add required dateOfBirth and governmentId fields
Tracking number format (magkakaroon ng problem sa pagfetch using apptmnent number
Frontend: APT-2026-XXXX (4 digits, hardcoded year)
Backend: generateTrackingNumber() does ts: APT-YYYYMMDD-XXXXX (date-based, 5 alphanumeric chars
Hayaan nyu backend mag gen ng numbah

---

**Assistant:**

I can see you have multiple issues to fix in your API implementation. Let me first read the current `api.ts` file to understand the current state and then provide a plan to fix all these issues.



I need to access the file system to read the current API implementation. Let me try a different approach to examine the current code.



I need to understand the workspace structure first. Let me check what's available in the current directory.





I see the issue - there's no workspace folder open. Based on your environment context, I can see you have the file `/C:/Users/User/gov-appt-system/src/app/services/api.ts` open. Let me provide you with a comprehensive plan to fix all the issues you've identified.

## Issues Summary & Fix Plan

You have 3 main issues to resolve:

### **Issue 1: API Calling Code Fixes**

1. **authAPI.login** - Should call `POST /api/auth/login` instead of local mock comparison
2. **authAPI.logout** - Should call `POST /api/auth/logout` to invalidate JWT server-side  
3. **appointmentAPI.create** - Should send `personalDetails` as JSONB object, not flat fields
4. **serviceAPI.getAll** - Should return real UUIDs, not hardcoded mock data with slugs

### **Issue 2: Service Data Mismatch**

1. **businessHours** → Should be `operatingHours: ServiceHours` object with `startTime`, `endTime`, `daysOfWeek`, `capacity`
2. **requiresDocuments** → Should be `requiredDocuments: string[]` (array of document names)
3. **Missing fields** - Need to add `duration`, `capacity`, `isActive`, `archivedAt`, `createdBy`

### **Issue 3: Input Handling & Data Format**

1. **Date/Time format** - Combine `date: string` and `time: string` into ISO datetime string
2. **AppointmentFormData field mismatches**:
   - `fullName` → Split into `firstName` + `lastName`
   - `phone` → Rename to `phoneNumber`
   - `address` → Make required
   - `notes` → Rename to `remarks`
   - Add `dateOfBirth` and `governmentId` (required)
3. **Tracking number** - Let backend generate format: `APT-YYYYMMDD-XXXXX`

## Recommended Fix Approach

Here's what you should do:

### **Step 1: Update API Service Types**

First, update your TypeScript interfaces to match backend:

```typescript
// Service interface
interface Service {
  id: string; // UUID from backend
  name: string;
  description: string;
  operatingHours: ServiceHours; // not businessHours: string
  requiredDocuments: string[]; // not requiresDocuments: boolean
  duration: number;
  capacity: number;
  isActive: boolean;
  archivedAt?: string;
  createdBy?: string;
}

interface ServiceHours {
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
  capacity: number;
}

// PersonalDetails interface for appointments
interface PersonalDetails {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string;
  governmentId: string;
  remarks?: string;
}

// Appointment creation payload
interface CreateAppointmentPayload {
  serviceId: string;
  appointmentDateTime: string; // ISO datetime string
  personalDetails: PersonalDetails; // JSONB object
}
```

### **Step 2: Fix API Implementation**

Update your `api.ts` file:

```typescript
// authAPI.login - replace mock with real API call
export const authAPI = {
  async login(credentials: { email: string; password: string }): Promise<LoginResponse> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// appointmentAPI.create - send personalDetails as JSONB
export const appointmentAPI = {
  async create(appointmentData: CreateAppointmentPayload): Promise<Appointment> {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointmentData)
    });
    
    if (!response.ok) throw new Error('Appointment creation failed');
    return response.json();
  }
};

// serviceAPI.getAll - fetch from real endpoint
export const serviceAPI = {
  async getAll(): Promise<Service[]> {
    const response = await fetch('/api/services');
    if (!response.ok) throw new Error('Failed to fetch services');
    return response.json();
  }
};
```

### **Step 3: Update Form Handling**

Create a utility function to transform frontend form data to backend format:

```typescript
function transformAppointmentFormData(formData: FrontendAppointmentForm): CreateAppointmentPayload {
  // Split fullName into firstName and lastName
  const [firstName, ...lastNameParts] = formData.fullName.split(' ');
  const lastName = lastNameParts.join(' ') || '';

  // Combine date and time into ISO string
  const appointmentDateTime = new Date(`${formData.date}T${formData.time}`).toISOString();

  return {
    serviceId: formData.serviceId,
    appointmentDateTime,
    personalDetails: {
      firstName,
      lastName,
      phoneNumber: formData.phone,
      address: formData.address || '', // make required
      dateOfBirth: formData.dateOfBirth, // add this field to your form
      governmentId: formData.governmentId, // add this field to your form
      remarks: formData.notes
    }
  };
}
```

### **Step 4: Update Frontend Components**

1. **Update service display** - Use `service.id` (UUID) instead of slug
2. **Update form fields** - Add `dateOfBirth` and `governmentId` inputs
3. **Update time handling** - Use datetime picker instead of separate date/time
4. **Remove tracking number generation** - Let backend handle it

## Immediate Actions You Can Take:

1. **Open the `api.ts` file** and replace mock implementations with real API calls
2. **Update your TypeScript interfaces** to match backend schemas
3. **Modify form components** to collect all required fields
4. **Add data transformation logic** before sending to API

Would you like me to help you implement any specific part of this fix? I can provide more detailed code examples for the areas you're working on.

---
