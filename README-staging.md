# ShiftPal - Staging Environment

This is the **staging environment** for ShiftPal development and testing.

## 🚧 Staging Environment

- **Purpose**: Development and testing environment
- **Firebase Project**: `shiftpal-staging`
- **URL**: `https://jaos-dev.github.io/ShiftPal-staging/`
- **Status**: Development in progress

## 🔧 Development Setup

```bash
# Clone the repository
git clone https://github.com/JAOS-DEV/ShiftPal-staging.git
cd ShiftPal-staging

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📱 Progressive Web App (PWA)

- Installable with a web app manifest and a Workbox-powered service worker via Vite's PWA plugin.
- Auto-update: when a new version is deployed, an in-app banner appears; clicking Reload updates.
- Offline: the app shell is cached for offline navigation; images use Cache First; Google Fonts use Stale-While-Revalidate; Firebase/Google APIs use Network First with a short timeout.

Local testing tips:

- Use Chrome DevTools > Application > Service Workers to simulate offline and updates.
- Run Lighthouse audits to verify PWA criteria.

Build modes and env:

- Continue using `VITE_*` env variables. Build as usual: `npm run build`.

## 🌐 Environment Configuration

This staging environment uses:

- **Firebase Project**: `shiftpal-staging`
- **Database**: Staging Firestore instance
- **Authentication**: Staging Firebase Auth
- **Storage**: Staging Firebase Storage

## 📋 Testing Checklist

Before promoting to production:

- [ ] All features tested
- [ ] Firebase connections working
- [ ] Authentication flows verified
- [ ] Data handling validated
- [ ] UI/UX reviewed

## 🚀 Deployment

```bash
# Build for staging
npm run build

# Deploy to GitHub Pages
# (Configured to deploy from main branch)
```

## 📚 Documentation

See `DEPLOYMENT.md` for detailed deployment and workflow information.

---

**Note**: This is a staging environment. For production, see the main `ShiftPal` repository.
