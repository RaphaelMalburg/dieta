# Diet Manager

A personal diet management application built with Next.js for couples to manage their diet plans and get AI-powered consultation.

## Features

- **Simple Authentication**: Hardcoded login system for two users
- **Diet Plan Management**: Upload PDF diet plans or enter them manually
- **AI Diet Consultation**: Chat with Gemini AI for diet advice and food substitutions
- **Mobile-First Design**: Optimized for phone usage
- **Local Database**: SQLite database for storing diet plans and chat history
- **Responsive Layout**: Works seamlessly on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Gemini API key from Google AI Studio

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd dieta
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Login Credentials

- **Tainara**: username: `tainara`, password: `laquie`
- **Raphael**: username: `raphael`, password: `laquie`

## Usage

1. **Login**: Use the default credentials to access the application
2. **Upload Diet Plans**: 
   - Switch between User 1 and User 2 tabs
   - Upload PDF files containing diet plans or enter them manually
   - Save the diet plans to the database
3. **AI Consultation**: 
   - Use the chat interface to ask questions about diet modifications
   - The AI has access to your current diet plan for context-aware responses
   - Ask for food substitutions, meal planning advice, etc.

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript
- **UI Components**: Shadcn/ui, Tailwind CSS
- **Database**: SQLite with better-sqlite3
- **AI Integration**: Google Gemini API
- **PDF Processing**: pdf-parse
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/
│   ├── api/          # API routes
│   ├── dashboard/    # Main dashboard page
│   ├── globals.css   # Global styles
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Login page
├── components/
│   ├── ui/           # Shadcn UI components
│   └── PDFUpload.tsx # PDF upload component
└── lib/
    ├── database.ts   # Database operations
    └── utils.ts      # Utility functions
```

## Deployment

This application is ready to be deployed on Vercel:

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

## Mobile Optimization

The application is specifically designed for mobile use with:
- Touch-friendly button sizes (minimum 44px)
- Responsive layout that adapts to screen size
- Optimized chat interface for mobile screens
- Smooth scrolling and touch interactions

## Contributing

This is a personal project, but feel free to fork and modify for your own use.

## License

MIT License - feel free to use this code for your personal projects.
