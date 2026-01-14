# Discord QR Code Setup Instructions

## Overview
The SignUp page now displays a Discord QR code to help new users get their access token from the admin.

## Setup Steps

### 1. Save Your Discord QR Code Image
- Save your Discord QR code image (the one you provided) as: `public/discord-qr.png`
- The image should be in PNG format
- Recommended size: 500x500px or larger for clarity

### 2. File Location
```
public/
  └── discord-qr.png  ← Place your QR code image here
```

### 3. What Users Will See

When users visit the SignUp page, they will see:

1. **QR Code Section** (above the token input field):
   - Header: "💬 Need a Token?"
   - Description: "Connect with our admin on Discord to get your access token"
   - Your Discord QR code image (scannable)
   - Step-by-step instructions:
     - Step 1: Scan QR code with Discord app
     - Step 2: Add **galaxykicklock** as friend
     - Step 3: Request your access token

2. **Token Input Field**:
   - Users enter the token they received from you
   - Required for account activation

## User Flow

1. New user visits SignUp page
2. Sees Discord QR code with instructions
3. Scans QR code with Discord mobile app
4. Adds **galaxykicklock** as friend on Discord
5. Messages you to request an access token
6. You generate a token from Admin Dashboard
7. Send token to user via Discord
8. User enters token in SignUp form
9. User completes registration

## Design Features

- **Gaming-themed**: Matches the Galaxy Kick Lock aesthetic
- **Clear instructions**: Step-by-step guide for users
- **Responsive**: Works on mobile and desktop
- **Hover effect**: QR code scales slightly on hover
- **Fallback**: If image fails to load, shows placeholder text

## Styling

The QR code section includes:
- Blue accent colors matching the app theme
- Dark background with subtle borders
- Numbered steps for clarity
- Smooth animations
- Mobile-responsive design

## Testing

After adding your QR code image:
1. Run the app locally: `npm run dev`
2. Navigate to SignUp page
3. Verify QR code displays correctly
4. Test scanning with Discord mobile app
5. Ensure it adds **galaxykicklock** as friend

## Notes

- The QR code is displayed **above** the token input field
- Users must still enter a valid token to complete signup
- The QR code helps users know how to get a token
- This prevents confusion about where to get access tokens
