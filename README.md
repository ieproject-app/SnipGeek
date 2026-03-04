# SnipGeek - Modern Tech Blog & Internal Toolkit

SnipGeek is a high-performance, minimalist website that serves a dual purpose: a public-facing technology blog and a suite of powerful internal tools designed to streamline administrative tasks. Built with Next.js 15, React 19, and Firebase, it offers a fast, secure, and modern user experience.

## ✨ Features

### 1. Technology Blog
A clean, minimalist, and fast-loading blog focused on technology topics. Articles are written in MDX, allowing for rich content and interactive components.

### 2. Internal Tools
A collection of utilities built to solve specific business needs.

#### 🧑‍💼 Employee History & Signatory Checker
This public-facing tool allows anyone to quickly search through the company's employee history. It's primarily used to find the correct officials (Pejabat) responsible for signing specific documents based on the document type and date.

*   **Status:** 🟢 **Public Access**
*   **Features:**
    *   Search employees by name, NIK, or position.
    *   Filter results by date to find who was active at a specific time.
    *   Automatically generate a list of required signatories for various document types (e.g., BAUT, BAST, AMD).

#### 🤖 AI Article Prompt Generator
A specialized tool for content creators to generate detailed, structured prompts for an AI (like GPT-4). This ensures consistency and quality for new articles or for modifying existing ones.

*   **Status:** 🟢 **Public Access**
*   **Features:**
    *   **Create Mode:** Generates a comprehensive prompt for a new article, including frontmatter (metadata), image paths, download links, and content structure.
    *   **Modify Mode:** Generates a prompt to update an existing article, providing the original content and specific modification instructions.
    *   Supports complex elements like image grids and downloadable files.

#### 🔐 Number Generator
An internal-only tool for generating sequential, formatted serial numbers for official documents. Access is restricted to authorized users.

*   **Status:** 🔴 **Requires Login**
*   **Features:**
    *   Generates numbers based on document type, year, and month.
    *   Ensures no duplicate numbers are issued.

## 🚀 Getting Started & Deployment

The application is hosted on **Firebase App Hosting** and deployed automatically via GitHub Actions.

### 1. Push Code to GitHub
Ensure your code is pushed to the `main` branch of the designated GitHub repository.

```bash
# For first-time setup
git init
git add .
git commit -m "Initial deployment"
git branch -M main
git remote add origin https://github.com/ieproject-app/SnipGeek.git
git push -u origin main
```

### 2. Environment Variables
For the application to connect to Firebase services, the following environment variables must be set in the Firebase Console under **App Hosting > Your App > Settings > Environment Variables**:

*   `NEXT_PUBLIC_FIREBASE_API_KEY`
*   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
*   `NEXT_PUBLIC_FIREBASE_APP_ID`
*   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`

### 3. Trigger a Build
After setting or changing environment variables, you **must** trigger a new deployment. Go to the **Rollouts** tab in your Firebase App Hosting dashboard and click **Start Rollout**. This is crucial for Next.js to correctly inject the public environment variables into the application build.

## 🛠️ Technical Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Authentication**: Firebase Authentication (Google Sign-In)
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI
- **Deployment**: Automatic via GitHub + Firebase App Hosting
