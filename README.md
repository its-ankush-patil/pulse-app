# 🧘 Pulse: Chant Counter

Pulse is a modern, beautifully designed web application for tracking mindfulness practices, specifically chanting. Built with React, Vite, and Firebase.

## 🚀 Deployment (Cloudflare Pages)

We have chosen **Cloudflare Pages** as our hosting provider for its unlimited free-tier bandwidth and global edge network.

### Prerequisites
1. Push this code to a repository on **GitHub**, **GitLab**, or **Bitbucket**.
2. Create a free account on [Cloudflare](https://dash.cloudflare.com/sign-up/pages).

### Step-by-Step Setup
1. Log in to the Cloudflare Dashboard and navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Select your repository.
3. In the **Set up builds and deployments** section, configure the following:
   * **Framework preset:** `Vite` (or `None` if Vite isn't listed)
   * **Build command:** `npm run build`
   * **Build output directory:** `dist`
4. Click **Save and Deploy**!

### SPA Routing
A `_redirects` file has already been added to the `public/` directory (`/* /index.html 200`) to ensure Cloudflare Pages properly handles client-side routing for the Single Page Application.

---

## 🛠 Local Development

1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`
