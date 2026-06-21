# Team & Task Management System

> A modern, collaborative task manager with a polished UI and animated cards for an engaging experience.

## Features
- **User auth**: Email/password, GitHub OAuth, email verification
- **Projects & teams**: Create projects, invite members, manage access
- **Tasks**: Create, assign, comment, and track progress
- **Streaks & productivity**: Track daily activity with streaks and charts
- **Notifications**: Real-time updates via sockets
- **Animated Cards**: Smoothly animated dashboard cards for better visual feedback

## Quick Install (for non-technical users)
These steps assume you're on Windows and have the project folder on your computer.

1. Install prerequisites (only once):

```powershell
choco install nodejs-lts git -y
# or download installers from nodejs.org and git-scm.com
```

2. Open `PowerShell` and change to the project folder:

```powershell
cd "C:\path\to\project"
# Example: cd "C:\Users\You\Downloads\Team-and-Task-Management-System"
```

3. Install backend dependencies and start the server:

```powershell
cd Backend
npm install
npm run start
# or if package.json uses `dev` script: npm run dev
```

4. Install frontend dependencies and start the client:

```powershell
cd ..\Frontend
npm install
npm run dev
# Open the URL shown (usually http://localhost:5173)
```

5. Open the app in your browser and log in.

If anything fails, copy the error message and ask for help — it's usually one command away from fixing.

## Animated Cards
The dashboard uses lightweight animated cards to make the UI feel modern. Cards gently scale and cast a shadow on hover to draw attention without distraction.

If you'd like to customize the animation, edit `Frontend/src/components/common/AnimatedCard.jsx` and change Tailwind classes such as `hover:scale-105` or `transition-duration` values.

If you want me to push these changes to your GitHub repository from this environment, confirm and I will run the git commands.
