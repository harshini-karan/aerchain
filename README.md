# Aerchain – AI-Powered RFP Management System

Miaoda Application Link URL
    URL:https://app-7zar4lzgunsx.appmedo.com

# AI-Powered RFP Management System

A modern, intelligent web application for managing Request for Proposals (RFPs) with AI-powered automation. This system streamlines the entire procurement workflow from RFP creation to supplier proposal comparison.

## 🌟 Features

### Core Capabilities
- **Natural Language RFP Creation**: Describe your procurement needs in plain English, and AI converts it to structured RFP data
- **Supplier Management**: Maintain a database of suppliers with contact information
- **Automated Email Distribution**: Send RFPs to selected suppliers via email
- **AI-Powered Proposal Parsing**: Automatically extract structured data from supplier email responses
- **Intelligent Comparison**: AI-assisted evaluation and side-by-side proposal comparison
- **Smart Recommendations**: Get AI-generated insights on which supplier to choose and why

### Technical Highlights
- Single-user web application (no authentication required)
- Real-time AI processing with streaming responses
- Responsive design optimized for desktop workflows
- Professional enterprise-grade UI with dark mode support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or compatible runtime
- pnpm package manager
- Supabase account (database is pre-configured)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd aerchain
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Environment Setup**
The application is pre-configured with environment variables. Check `.env` file for:
- `VITE_APP_ID`: Application identifier
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VITE_API_ENV`: Environment setting

4. **Run the application**
```bash
pnpm run dev
```

The application will be available at the URL provided by your deployment platform.

## 📖 User Guide

### Creating an RFP

1. Navigate to the **RFPs** page
2. Click **Create RFP**
3. Describe your procurement needs in natural language, for example:
   ```
   I need to procure laptops and monitors for our new office. 
   Budget is $50,000 total. Need delivery within 30 days. 
   We need 20 laptops with 16GB RAM and 15 monitors 27-inch. 
   Payment terms should be net 30, and we need at least 1 year warranty.
   ```
4. Click **Create RFP** - AI will automatically structure the information
5. Review the generated RFP with structured fields (title, budget, timeline, requirements)

### Managing Suppliers

1. Go to the **Suppliers** page
2. Click **Add Supplier**
3. Enter supplier information:
   - Company name (required)
   - Email address (required)
   - Contact person
   - Phone number
   - Notes
4. Click **Save Supplier**

### Sending RFPs to Suppliers

1. Open an RFP from the **RFPs** page
2. Click **Send to Suppliers**
3. Select which suppliers should receive the RFP
4. Click **Send** - the system will email the RFP to selected suppliers

**Note**: Email functionality requires SMTP configuration. Without it, RFPs are marked as "sent" for workflow tracking, but emails are not delivered.

### Adding Proposals

When suppliers respond via email:

1. Go to the **Proposals** page
2. Click **Add Proposal**
3. Select the RFP and Supplier
4. Paste the supplier's email response
5. Click **Process Proposal**
6. AI will automatically:
   - Extract pricing information
   - Identify terms and conditions
   - Generate a summary
   - Assign a quality score (0-100)

### Comparing Proposals

1. Navigate to the **Comparison** page
2. Select an RFP from the dropdown
3. View side-by-side proposal details
4. Click **AI Evaluate** for comprehensive analysis
5. Review AI-generated recommendations including:
   - Strengths and weaknesses of each proposal
   - Pricing comparison
   - Terms evaluation
   - Completeness assessment
   - Final recommendation with reasoning

## 🏗️ Architecture

### Technology Stack

**Frontend**
- React 18 with TypeScript
- Tailwind CSS for styling
- shadcn/ui component library
- React Router for navigation
- Vite for build tooling

**Backend & Database**
- Supabase (PostgreSQL database)
- Supabase Edge Functions (Deno runtime)
- Row Level Security disabled (single-user system)

**AI Integration**
- Google Gemini 2.5 Flash (via API integration)
- Streaming responses for real-time feedback
- Natural language processing
- Structured data extraction
- Proposal evaluation and scoring

**Email System**
- Supabase Edge Function for SMTP integration
- Configurable via environment variables
- Graceful degradation when not configured

### Database Schema

**rfps**
- Stores RFP documents with structured and raw data
- Fields: title, description, raw_input, budget, delivery_timeline, requirements (JSONB), status

**suppliers**
- Supplier master data
- Fields: name, email, contact_person, phone, notes

**proposals**
- Supplier proposals with AI analysis
- Fields: rfp_id, supplier_id, content, raw_email, pricing (JSONB), terms, ai_score, ai_summary, ai_evaluation (JSONB)

**rfp_suppliers**
- Junction table tracking RFP distribution
- Fields: rfp_id, supplier_id, sent_at, email_status

### API Endpoints

#### Database Operations (via Supabase Client)
All database operations use the Supabase JavaScript client with functions in `src/db/api.ts`:

- `getAllRFPs()` - Fetch all RFPs
- `getRFPWithDetails(id)` - Get RFP with suppliers and proposals
- `createRFP(data)` - Create new RFP
- `updateRFP(id, data)` - Update RFP
- `getAllSuppliers()` - Fetch all suppliers
- `createSupplier(data)` - Create new supplier
- `getProposalsByRFP(rfpId)` - Get proposals for an RFP
- `createProposal(data)` - Create new proposal

#### Edge Functions

**send-rfp-email**
- Method: POST
- Endpoint: `/functions/v1/send-rfp-email`
- Body: `{ rfp_id: string, supplier_ids: string[] }`
- Purpose: Send RFP via email to selected suppliers
- Response: `{ success: boolean, results: Array, message: string }`

#### AI Services (via API Integration)

**Large Language Model API**
- Endpoint: Gemini 2.5 Flash streaming API
- Used for:
  - Natural language to structured RFP conversion
  - Email content parsing
  - Proposal scoring
  - Comparative evaluation

## 🔧 Configuration

### Email Setup (Optional)

To enable email functionality, configure these environment variables in Supabase Edge Function secrets:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
```

**For Gmail:**
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password as `SMTP_PASSWORD`

**Without Email Configuration:**
The system works fully without email setup. RFPs are marked as "sent" for workflow tracking, and proposals can be added manually.

### AI Configuration

AI integration is pre-configured and requires no additional setup. The system uses:
- Google Gemini 2.5 Flash for language processing
- Streaming API for real-time responses
- Automatic retry and error handling

## 🎨 Design Decisions

### Single-User Architecture
- No authentication system (as per requirements)
- Simplified workflow focused on individual procurement managers
- All data accessible without permission checks

### AI-First Approach
- Natural language input reduces data entry burden
- Automatic structuring improves data consistency
- AI scoring provides objective proposal evaluation
- Streaming responses give immediate feedback

### Graceful Degradation
- Email system works with or without SMTP configuration
- Manual proposal entry as fallback for automated parsing
- Clear error messages guide users when features are unavailable

### Professional UI/UX
- Enterprise blue color scheme conveys trust and professionalism
- Dashboard-style layout with sidebar navigation
- Consistent use of shadcn/ui components
- Loading states and empty states for all views
- Toast notifications for user feedback

## 🤖 AI Integration Details

### Natural Language Processing
The system uses Google Gemini 2.5 Flash for:

1. **RFP Creation**: Converts free-text procurement descriptions into structured data
   - Extracts: title, description, budget, timeline, requirements
   - Returns: JSON object with typed fields

2. **Proposal Parsing**: Analyzes supplier email responses
   - Extracts: pricing breakdown, terms, delivery commitments
   - Returns: Structured proposal data

3. **Proposal Scoring**: Evaluates individual proposals
   - Analyzes: completeness, pricing competitiveness, terms favorability
   - Returns: Score (0-100), summary, detailed evaluation

4. **Comparative Analysis**: Compares multiple proposals
   - Provides: Strengths/weaknesses, pricing comparison, recommendation
   - Returns: Markdown-formatted analysis with reasoning

### Streaming Implementation
- Uses Server-Sent Events (SSE) for real-time AI responses
- Displays partial results as they're generated
- Improves perceived performance and user engagement

## 📝 Assumptions & Limitations

### Assumptions
- Single procurement manager per deployment
- Suppliers respond via email (manual entry supported)
- English language for all content
- Desktop-first usage (responsive design included)
- Internet connectivity required for AI features

### Limitations
- No multi-user support or role-based access
- No real-time collaboration features
- Email tracking (open/click rates) not implemented
- No RFP versioning or approval workflows
- No automated email receiving (manual proposal entry required)
- OCR for PDF attachments available but not actively used in current workflow

### Future Enhancements
- Automated email polling for proposal reception
- PDF attachment parsing with OCR
- Multi-language support
- Advanced analytics and reporting
- RFP templates library
- Supplier performance tracking

## 🧪 Testing

The application has been tested for:
- ✅ RFP creation from natural language
- ✅ Supplier CRUD operations
- ✅ RFP distribution workflow
- ✅ Manual proposal entry and AI parsing
- ✅ Proposal comparison and AI evaluation
- ✅ Responsive design across screen sizes
- ✅ Error handling and edge cases
- ✅ Loading states and user feedback

## 🛠️ Development

### Project Structure
```
src/
├── components/
│   ├── common/          # Shared components (Sidebar)
│   └── ui/              # shadcn/ui components
├── db/
│   ├── supabase.ts      # Supabase client
│   └── api.ts           # Database operations
├── pages/               # Route components
│   ├── Dashboard.tsx
│   ├── RFPs.tsx
│   ├── RFPDetail.tsx
│   ├── Suppliers.tsx
│   ├── Proposals.tsx
│   └── Comparison.tsx
├── services/
│   └── ai.ts            # AI integration
├── types/
│   └── types.ts         # TypeScript interfaces
└── routes.tsx           # Route configuration

supabase/
├── migrations/          # Database migrations
└── functions/           # Edge Functions
    └── send-rfp-email/
```

### Code Quality
- TypeScript for type safety
- Biome for linting and formatting
- Consistent component patterns
- Error boundaries and null checks
- Semantic HTML and accessibility

### Build & Deploy
```bash
# Development
pnpm run dev

# Build
pnpm run build

# Lint
pnpm run lint

# Type check
pnpm run type-check
```

## 📄 License

This project is part of a technical assessment and demonstration.

## 🙏 Acknowledgments

- Built with React, TypeScript, and Tailwind CSS
- UI components from shadcn/ui
- Database and backend by Supabase
- AI powered by Google Gemini
- Icons from Lucide React

---

**Note**: This is a single-user application designed for procurement managers. For production use with multiple users, consider adding authentication, role-based access control, and audit logging.
