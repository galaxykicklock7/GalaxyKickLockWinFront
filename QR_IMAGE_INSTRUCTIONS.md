# Discord QR Code Image Setup

## IMPORTANT: Replace Placeholder Image

The SignUp modal currently shows a placeholder QR code. You need to replace it with your actual Discord QR code.

## Steps to Add Your QR Code:

### Option 1: Save to Public Folder (Recommended)
1. Save your Discord QR code image as: `public/discord-qr.png`
2. Update line in `src/components/SignUp.jsx`:
   ```javascript
   // Change from:
   src="https://i.imgur.com/placeholder.png"
   
   // To:
   src="/discord-qr.png"
   ```

### Option 2: Use External URL
1. Upload your QR code to an image hosting service (Imgur, Cloudinary, etc.)
2. Update the `src` attribute in `src/components/SignUp.jsx` with the URL

### Option 3: Use Base64 (For Small Images)
1. Convert your QR code to base64
2. Replace the src with: `src="data:image/png;base64,YOUR_BASE64_STRING"`

## Current Behavior:
- Modal opens when user clicks/focuses on token input field
- Shows placeholder QR code with visual representation
- User can close modal and enter token
- "Click here to get one" link also opens modal

## Your QR Code Details:
- Discord username: **galaxykicklock**
- Purpose: Add friend to request access token
- Image should be clear and scannable
- Recommended size: 500x500px or larger

## Testing:
1. Add your QR code image
2. Run: `npm run dev`
3. Go to SignUp page
4. Click on token field or "Click here to get one"
5. Scan QR code with Discord mobile app
6. Verify it adds galaxykicklock as friend
