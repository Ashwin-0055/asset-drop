# AssetDrop

**Professional asset collection platform for creative agencies and freelancers.**

Stop the email chaos. AssetDrop lets you create custom-branded portals where clients can easily upload files, while you maintain complete control and organization through Google Drive integration.

---

## 🚀 Features

- **Custom Form Builder**: Drag-and-drop interface to create custom asset collection forms
- **Magic Link Authentication**: Passwordless sign-in for users
- **Google Drive Integration**: All uploads automatically organized in your Google Drive
- **Client Portal**: Shareable, password-protected upload portals for clients
- **Asset Approval Workflow**: Review, approve, or reject client submissions
- **Activity Timeline**: Complete audit trail of all project activities
- **Real-time Updates**: Optimistic UI updates for instant feedback
- **Beautiful Animations**: Smooth, professional animations throughout
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth)
- **Storage**: Google Drive API
- **State Management**: React Query + Zustand
- **Form Builder**: dnd-kit

---

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account ([supabase.com](https://supabase.com))
- A Google Cloud Platform account for Drive API

---

## ⚙️ Setup Instructions

### 1. Clone and Install

```bash
# Navigate to project directory
cd "C:\Users\Ashwin yadav\Desktop\fresh assetdrop"

# Install dependencies
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy your project URL and anon key
4. Go to SQL Editor and run the migration from `supabase/migrations/001_initial_schema.sql`

### 3. Set Up Google Drive API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Google Drive API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Configure OAuth consent screen (add scopes: `drive.file`, `userinfo.profile`)
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
7. Copy your Client ID and Client Secret

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
assetdrop/
├── app/                          # Next.js app router
│   ├── (auth)/
│   │   └── login/               # Magic link login page
│   ├── api/                     # API routes
│   │   ├── auth/                # Authentication callbacks
│   │   ├── google-drive/        # Google Drive OAuth
│   │   ├── upload/              # File upload endpoint
│   │   └── projects/            # Project API endpoints
│   ├── builder/[id]/            # Form builder page
│   ├── collect/[linkId]/        # Client portal (public)
│   ├── dashboard/               # Main dashboard
│   ├── project/[id]/            # Project detail view
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   └── providers.tsx            # React Query provider
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── builder/                 # Form builder components
│   ├── client-portal/           # Client portal components
│   ├── dashboard/               # Dashboard components
│   └── project/                 # Project view components
├── hooks/
│   ├── useAuth.ts               # Authentication hook
│   ├── useGoogleDrive.ts        # Google Drive hook
│   ├── useProjects.ts           # Projects data hook
│   └── use-toast.ts             # Toast notifications hook
├── lib/
│   ├── supabase/                # Supabase client configs
│   ├── google-drive/            # Google Drive API
│   └── utils.ts                 # Utility functions
├── types/
│   ├── database.types.ts        # Database TypeScript types
│   └── builder.ts               # Form builder types
└── supabase/
    └── migrations/              # Database migrations
```

---

## 🎯 Usage Guide

### For Project Owners

1. **Sign Up**: Enter your email on the landing page
2. **Connect Google Drive**: Link your Google Drive account to store files
3. **Create Project**: Click "+ Create Project" on dashboard
4. **Build Form**: Drag components to create your custom form
   - File Upload: For any file type
   - Text Input: For text responses
   - URL Field: For link submissions
   - Image Gallery: For multiple images
   - Audio/Video: For media files
   - Code Snippet: For code submissions
   - Section Header: To organize your form
5. **Publish**: Generate a shareable link
6. **Share**: Send the link to your client
7. **Review**: Approve or reject submissions from the Assets tab

### For Clients

1. **Open Link**: Click the link shared by the project owner
2. **Enter Password**: If required
3. **Fill Form**: Complete all required fields
4. **Upload Files**: Drag and drop or browse files
5. **Submit**: Click submit button
6. **Done**: Receive confirmation

---

## 🗄️ Database Schema

### Tables

- **profiles**: User profiles (extends Supabase auth.users)
- **user_tokens**: Google Drive OAuth tokens
- **projects**: Asset collection projects
- **form_fields**: Form builder configuration
- **assets**: Uploaded files metadata
- **activity_log**: Audit trail of all actions

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- Project links are publicly accessible (for client portal)
- Proper authorization checks on all operations

---

## 🔐 Security Features

- **Passwordless Authentication**: Magic link via email
- **Row Level Security**: Database-level access control
- **Password Protection**: Optional password for shareable links
- **Link Expiration**: Time-limited access to forms
- **Token Encryption**: Secure Google Drive token storage
- **Input Validation**: All user inputs sanitized
- **CSRF Protection**: Built-in Next.js protection

---

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Update Google OAuth redirect URI to production URL
5. Deploy

### Production Checklist

- [ ] Set up custom domain
- [ ] Update Google OAuth redirect URIs
- [ ] Update `NEXT_PUBLIC_APP_URL` environment variable
- [ ] Enable Supabase production mode
- [ ] Set up email templates in Supabase
- [ ] Configure error monitoring (Sentry, LogRocket, etc.)
- [ ] Set up analytics (Vercel Analytics, Google Analytics)

---

## 🎨 Customization

### Branding

- Update logo in `app/layout.tsx`
- Customize colors in `tailwind.config.ts`
- Modify landing page copy in `app/page.tsx`

### Email Templates

Customize Supabase email templates:
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Edit Magic Link template
3. Add your branding and copy

---

## 📊 Performance

- **Bundle Size**: < 200KB initial JS
- **Lighthouse Score**: > 90
- **Animations**: 60fps with GPU acceleration
- **Caching**: Aggressive with React Query
- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component

---

## 🐛 Troubleshooting

### Google Drive Connection Issues

- Verify OAuth credentials are correct
- Check redirect URI matches exactly
- Ensure Drive API is enabled in Google Cloud Console
- Clear browser cookies and try again

### Magic Link Not Received

- Check spam folder
- Verify email in Supabase dashboard logs
- Ensure SMTP is configured (or use Supabase default)

### File Upload Errors

- Check Google Drive token hasn't expired
- Verify user has storage space in Drive
- Check file size limits (50MB default)
- Ensure proper permissions in Google Cloud Console

---

## 🤝 Contributing

This is a proprietary project. For bug reports or feature requests, please contact the development team.

---

## 📄 License

Proprietary - All rights reserved

---

## 👨‍💻 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Code Style

- TypeScript strict mode enabled
- ESLint with Next.js config
- Prettier for formatting
- Component naming: PascalCase
- File naming: kebab-case

---

## 📞 Support

For support inquiries, please contact: support@assetdrop.com

---

**Built with ❤️ using Next.js, TypeScript, and Supabase**
