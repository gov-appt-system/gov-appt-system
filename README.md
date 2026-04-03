# Government Appointment Booking System

A government agency appointment scheduling system with role-based access control,
real-time availability, and email notifications.

**Working Prototype (Frontend):**
[View Figma Prototype](https://www.figma.com/make/J66xF8HBB6PSimi7D7KHdo/Government-Appointment-Booking-System?p=f&t=MVCBImR2iRFXcUt9-0&preview-route=%2Flogin)

> **Status:** Backend API in active development. Frontend in progress.

---

## Team Branches pag may guimalaw sa main branch ggulpihin q

|MAIN BRANCH FOR DEPLOYMENT |`main`|
| Staging Branch (pre-deployment and merging of front/back) |`staging-branch`|
| Frontend | `frontend-branch` |
| Backend (Kate) | `branch-kate` |
| Backend (Gato) | `branch-gato` |

---

## 1. Install Git (Windows)

1. Go to https://git-scm.com/download/win
2. Click **"Click here to download"** — it auto-detects 64-bit Windows
3. Run the downloaded `.exe` installer
4. During setup, keep all defaults **except**:
   - On **"Choosing the default editor"** → select **Visual Studio Code** (if you use it)
   - On **"Adjusting your PATH environment"** → select **"Git from the command line and also from 3rd-party software"**
5. Click **Next** through the rest, then **Install**
6. Verify the install — open **Command Prompt** or **PowerShell** and run:

```bash
git --version
```

You should see something like `git version 2.x.x.windows.x`.

---

## 2. Clone the Repository

Go to terminal on VS Code, use this command para mabilis [ctrl + `]

```
# Clone the repo
git clone https://github.com/gov-appt-system/gov-appt-system.git

# Enter the project folder
cd gov-appointment-app
```

### Install Dependencies

Make sure you have **Node.js 18+** and **pnpm** installed first (idk pa sa frontend magkaiba version soo here's what we do for now yall, gawin niyo sa vscode per usual)

```bash
# Install pnpm if you don't have it
npm install -g pnpm

# Install all dependencies from the root
pnpm install
```

---

## 3. Switch to Your Team's Branch

```bash
# Frontend team
git checkout frontend-branch

# Backend — Kate
git checkout branch-kate

# Backend — Gato
git checkout branch-gato
```

---

## 4. Basic Git Commands

### Check status and history

```bash
# See what files you've changed
git status

# See commit history
git log --oneline
```

### Pull latest changes from remote

```bash
# Always pull before starting work to avoid conflicts
git pull origin <your-branch-name>
```

### Stage and commit your changes

```bash
# Stage a specific file
git add filename.ts

# Stage ALL changed files
git add .

# Commit with a message
git commit -m "your message here"
```

### Push your commits

```bash
git push origin <your-branch-name>
```

### Examples per team

```bash
# Frontend
git push origin frontend-branch

# Backend Kate
git push origin branch-kate

# Backend Gato
git push origin branch-gato
```

---

## 5. Recommended Workflow (Daily)

```bash
# 1. Pull latest before you start
git pull origin <your-branch>

# 2. Make your changes...

# 3. Stage and commit
git add .
git commit -m "brief description of what you did"

# 4. Push
git push origin <your-branch>
```

---

## Tips

- **Never push directly to `main`** — always work on your team's branch
- Write clear commit messages (e.g. `"add login form validation"` not `"fix stuff"`)
- Pull before you push to avoid merge conflicts (WAG MAG FFORCE HAA)
- If you get a merge conflict, ask your team lead before resolving it
```
