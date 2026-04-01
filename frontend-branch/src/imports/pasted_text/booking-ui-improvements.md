Improve the Book Appointment interface so that services are organized by category → service list. The goal is to make the selection clean, structured, and easy for users to understand. Step 1 – Category Selection (First Screen) Display service categories as clickable cards arranged in a clean grid layout. Each card contains: Category icon Category name Short description Hover effect Clickable interaction Categories: 1. Certifications & Documents General government document requests and certifications. 2. Public Safety Documents issued by agencies such as the Philippine National Police and Bureau of Fire Protection. 3. Health & Social Welfare Programs and records handled by the Department of Health and Department of Social Welfare and Development. 4. Civil Registry Official personal records issued by the Philippine Statistics Authority. 5. Disaster & Community Services Services handled by Local Government Units (LGUs) and National Disaster Risk Reduction and Management Council. Step 2 – Service List (After Clicking Category) When the user clicks a category card, open a service list container showing all services under that category. Certifications & Documents General document-related requests. Services: Certificate of Residency Business Permit Request Community Tax Certificate (Cedula) Barangay Clearance for Business Each service should appear as a service card or selectable row with: Service Name Short Description “Select Service” button Public Safety (Commonly issued by agencies like the Philippine National Police and Bureau of Fire Protection) Services: Police Clearance NBI Clearance Barangay Clearance Fire Safety Inspection Certificate Certificate of No Criminal Record Health & Social Welfare (Programs handled by DOH and DSWD) Services: Medical Certificate PWD ID / Certification Senior Citizen ID PhilHealth Member Data Record (MDR) Indigency Certificate Civil Registry (Records issued by the Philippine Statistics Authority) Services: Birth Certificate Marriage Certificate Death Certificate Certificate of No Marriage (CENOMAR) Advisory on Marriages Disaster & Community Services (Handled by LGUs and NDRRMC) Services: Calamity Victim Certification Disaster Assistance Certificate Damage Assessment Report Relief Assistance Claim Form Evacuation Center Certification Step 3 – Continue Booking Flow After selecting a service, the user proceeds to: Date Selection (Calendar) Time Slot Selection Appointment Form Submit Appointment Unavailable time slots must appear grayed out to prevent double booking. UI Behavior Service cards should include: Hover highlight Click interaction Clear spacing between services Consistent card layout        


2. Manager Interface Fixes
Service Management – Add New Service

Improve the Add New Service modal.

Category Dropdown Fix

Inside the modal, fix the Category dropdown menu.

The dropdown options must match the categories used in the client booking page:

Certifications & Documents

Public Safety

Health & Social Welfare

Disaster & Community Services

Ensure the dropdown:

Uses clear labels

Has a proper spacing layout

Shows category icons if possible

Add New Service Modal Fields

Modal should contain:

Category (Dropdown)

Service Name

Service Duration (e.g. 30 minutes, 1 hour)

Service Price

Description / Notes

Buttons:

Add Service

Cancel

3. Admin Interface Restrictions

Admins must have limited permissions.

Appointment Requests Page

Admins must NOT have action buttons.

Remove these actions for admins:

Accept appointment

Confirm appointment

Cancel appointment

Update status

Admin can only:

View appointment information

Search/filter appointments

Export data

Service Management Restrictions

Admins should NOT be allowed to add new services.

Remove:

Add Service button

Edit Service options

Admins can only:

View services

See service statistics

4. Admin – Add New Staff Modal

Replace the Add Staff page with a modal popup.

Add Staff Modal Fields

Modal contains:

Personal Information

Staff Name

Address

Role Information

Role (Dropdown: Staff / Manager)

Account Details

Email

Username

Temporary Password

Buttons:

Create Staff Account

Cancel

Modal behavior:

Appears centered

Background overlay

Can close with X button




1. Global UI Behavior – Confirmation Popups

All major or destructive actions must require a confirmation modal before the action is executed.

This prevents users from accidentally making important changes.

Actions that require confirmation

Cancel appointment

Delete appointment

Delete account

Delete staff

Submit appointment

Reschedule appointment

Confirmation Modal Structure

Title:
Confirm Action

Example Message:
Are you sure you want to cancel this appointment?

Buttons:

Confirm

Cancel

Modal Design

The confirmation modal should follow these UI rules:

Appears centered on the screen

Background behind the modal should have a slight blur or dark overlay

The Confirm button should be highlighted (primary color)

The Cancel button should be secondary or outlined

This confirmation system must be consistent across all pages and actions.

2. Profile Page – Edit Profile Functionality

Improve the Profile Page layout and editing behavior for all accounts.

Profile Layout

The profile page must contain one main profile container card.

Inside the container display the following fields:

Full Name

Email Address

Phone Number

Address

Default State

When the page loads:

All fields must be disabled / read-only

Inputs should appear slightly gray to indicate they are inactive

Edit Profile Flow

At the bottom-right corner of the profile container, place an:

Edit Profile Button

When Edit Profile is clicked

Input fields become editable

Fields activate with visible input borders

The Edit Profile button changes to “Update Profile”, 

Update Profile Behavior

After the user enters editing mode:

The system must not immediately save changes

The user should first modify at least one field

If the user did not change any information:

The Update Profile button should remain disabled

Or display a message like:
“No changes detected.”

If the user modifies any field:

The Update Profile button becomes active

Clicking Update Profile saves the changes

After saving:

Fields return to read-only mode

Input styling returns to disabled appearance

Visual Indicators
Disabled Fields

Slight gray background

No active border

Cursor disabled

Editable Fields

White background

Visible input border highlight

Cursor enabled

Clear focus state when typing