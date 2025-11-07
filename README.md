# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/c5a73e7a-876a-4e25-8bf8-c59c2c7f968b

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c5a73e7a-876a-4e25-8bf8-c59c2c7f968b) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Amazon Bedrock (for AI agent functionality)

## Environment Configuration

To connect this UI to Amazon Bedrock, you need to set up environment variables:

1. **Create a `.env` file** in the root directory (copy from `.env.example` if available)

2. **Required Environment Variables:**
   ```env
   # Supabase Configuration (if using Supabase)
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   
   # Bedrock API Endpoint
   # Option 1: Supabase Edge Function
   VITE_BEDROCK_API_URL=https://your-project.supabase.co/functions/v1/cfo-agent
   
   # Option 2: Custom API Gateway/Lambda
   # VITE_BEDROCK_API_URL=https://your-api-gateway-url.amazonaws.com/bedrock
   ```

3. **Backend Requirements:**
   - Your backend endpoint should accept POST requests with:
     - `message`: string (user's text input)
     - `files`: File[] (optional uploaded files)
   - Response format should be one of:
     - **Bedrock Traces Format**: `{ traces: BedrockTrace[] }`
     - **Direct Response**: `{ response: string, visualizationData?: any }`
     - **Structured Response**: `{ message: string, data?: any, type?: string }`

4. **Backend Implementation:**
   - The backend must handle Bedrock API calls (credentials should be on the backend, not in the UI)
   - Process files if uploaded
   - Return response in one of the supported formats above

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/c5a73e7a-876a-4e25-8bf8-c59c2c7f968b) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
