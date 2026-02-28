# RetinaScan

RetinaScan is a Next.js web app that lets a user upload a retinal scan image and receive an **AI screening result for diabetic retinopathy severity.**

This project supports early disease detection in healthcare, especially for conditions that can progress silently like diabetic retinopathy. It’s a great example of how AI can support clinicians by highlighting signals that may be easy to overlook and helping catch problems earlier.

> **Important:** This project is a screening demo and **not medical advice**. For diagnosis or treatment decisions, consult a licensed eye-care professional.

Made by: Amina Waqar, Bareera Gulraiz, Mukund Ummadisetti, Hanin Barakat 
As part of UCI CareTech AI X Healthcare.
---

## What this current version does is:

Takes a retinal image (JPG/PNG) (user can upload retinol scans)
Runs a pretrained ML model for **Diabetic Retinopathy** severity classification  
Show a clear user-facing result:
- **Diabetic retinopathy detected: Yes/No**
- **Severity estimate:** No Diabetic Retinopathy (No DR) / Mild / Moderate / Severe / Proliferative
- A simple “What does this mean?” explanation with a safety disclaimer.

Coming soon (not computed yet)
- Hypertensive Retinopathy
- Glaucoma
- Age-Related Macular Degeneration (AMD)


## Tech stack

- **Frontend:** Next.js (App Router), React, Tailwind UI components
- **Backend:** Next.js API route (`app/api/analyze`)
- **ML inference:** Python (Transformers and PyTorch) while using a pretrained Hugging Face retinal DR classification model

---

## Repository structure


RetinaScan/  
|__ app/ # Pages + backend API routes  
│ |__ page.tsx # Home page  
│ |__ scan/page.tsx # Scan page route  
│ |__ results/page.tsx # Results page route  
│ |__ api/analyze/route.ts # Server API endpoint (calls ML inference)  
│  
|__ components/ # Reusable UI components  
│ |__ scan-interface.tsx # Upload + calls /api/analyze, stores result  
│ |__ results-view.tsx # Results UI (Detected Yes/No + severity)  
│  
|__ ml/ # Local ML inference  
│ |__ infer.py # CLI inference (test model directly)  
│ |__ model.py # Model utilities/loading  
│ |__ requirements.txt # Python deps for inference  
│
|__ public/ # Static assets (images, icons, etc...)  
|__ README.md  

---

## How it works (notes for future)

### 1 Scan page (frontend)
`components/scan-interface.tsx`
- User selects an image
- Image is stored in state
- Sent to backend with `fetch("/api/analyze")` as `FormData`
- Response JSON is saved to `sessionStorage`
- User navigates to `/results`

### 2 Analyze endpoint (backend)
`app/api/analyze/route.ts`
- Receives `FormData`
- Extracts the image bytes
- Runs the ML inference (local Python model)
- Returns structured JSON to the frontend

### 3 Results page (frontend)
`components/results-view.tsx`
- Reads stored result from `sessionStorage`
- Shows:
  - Detected: Yes/No
  - Severity estimate
  - Simple explanation + disclaimer
  - "Coming soon" placeholders for other eye conditions!


