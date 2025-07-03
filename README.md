# Advanced Engineering & Performance Team Scope

This repository contains the living document for the Carbon Robotics Advanced Engineering & Performance team initiative.

## 📋 Live Document

🔗 **[View the Interactive Document](https://bryson-maka.github.io/carbonrobotics-aep-document/)**

## 📖 About

The Advanced Engineering & Performance team document is designed to establish data-driven performance excellence across the Carbon Robotics LaserWeeder fleet. This interactive document serves as both a mission statement and a practical planning document for team discussions and decision-making.

### Features

- **Interactive Mode**: Edit and track answers to outstanding questions
- **Progress Tracking**: Visual indicators showing completion status
- **Draft/Final Toggle**: Mark answers as draft or final with weighted completion
- **Export/Import**: Share progress via JSON files
- **Responsive Design**: Works on desktop and mobile devices

### Question Status System

- 🔴 **Red (0%)**: Unanswered questions
- 🟠 **Orange (50%)**: Draft answers
- 🟢 **Green (100%)**: Final answers

## ⚙️ Setup

### Prerequisites
- A Supabase account and project
- Access to Carbon Robotics Google domain (@carbonrobotics.com)

### Configuration Steps

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd carbonrobotics-aep-document
   ```

2. **Set up Supabase**
   - Create tables by running SQL files in Supabase Dashboard (SQL Editor):
     - Run `db/001_init_answers.sql` to create the answers table
     - Run `db/002_seed_answers.sql` to seed initial questions
   
3. **Configure client**
   - Copy `supabaseClient.js.example` → `supabaseClient.js`
   - Replace `YOUR_PUBLIC_ANON_KEY` with your project's anon key
   - Get your key from: Supabase Dashboard → Settings → API → Project API keys

4. **Run locally**
   ```bash
   python3 -m http.server 3000
   ```
   Then open http://localhost:3000

5. **First visit**
   - You'll be prompted to sign in with Google
   - Only @carbonrobotics.com accounts have access (enforced by RLS)

## 🚀 Usage

1. Visit the [live document](https://bryson-maka.github.io/carbonrobotics-aep-document/)
2. Sign in with your Carbon Robotics Google account
3. Answers save automatically as you type (with 500ms debounce)
4. Toggle between Draft/Final status for each answer
5. Changes sync in real-time across all open tabs/users
6. Use Export/Import for offline backup or sharing

## 💾 Data Persistence

- **Real-time Database**: Answers stored in Supabase with automatic sync
- **Collaborative Editing**: Multiple users can edit simultaneously
- **Export Feature**: Download current state as JSON for backup
- **Import Feature**: Restore from JSON backup files
- **Row-Level Security**: Only @carbonrobotics.com users can access

## 🎨 Design

The document uses Carbon Robotics' official color scheme and design language, matching the main robot web interface for consistency.

## 📁 Repository Structure

```
/
├── db/
│   ├── 001_init_answers.sql                  # Creates answers table with RLS
│   └── 002_seed_answers.sql                  # Seeds initial question IDs
├── index.html                                 # Main interactive document (GitHub Pages)
├── supabaseClient.js                         # Supabase configuration (gitignored)
├── supabaseClient.js.example                 # Template for Supabase config
└── README.md                                 # This file
```

---

**Carbon Robotics - Advanced Engineering & Performance Team**  
*Data-driven performance excellence for the LaserWeeder platform*