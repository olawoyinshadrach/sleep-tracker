# Restful Sleep Tracker

Restful Sleep Tracker is a mobile-first application designed to help users monitor and improve their sleep quality through data-driven insights and personalized recommendations.

## Overview

Restful Sleep Tracker empowers users to take control of their sleep health by offering intuitive tracking tools and meaningful analysis, all within a user-friendly interface optimized for mobile devices. The application leverages Firebase for authentication, data storage, and AI-powered insights.

## Key Features

### Interactive Sleep Dashboard
- Comprehensive sleep score visualization with quality indicators
- Rotating carousel displaying AI insights and sleep calculator access
- Weekly sleep duration and quality trends with interactive charts
- Sleep composition breakdown with detailed statistics
- Last night's sleep details with comparative analysis to goals

### AI-Powered Insights
- Smart analysis of sleep patterns using Firebase's generative AI model
- Personalized recommendations based on tracked sleep data
- Optimized caching system to reduce API calls while maintaining fresh insights
- Automatic fallback to static insights if AI generation encounters issues

### Manual Sleep Logging and Data Analysis
- Easy-to-use sleep diary for recording bedtime, wake time, and sleep quality
- Track sleep interruptions, dreams, and pre-sleep activities
- Identify patterns and correlations between habits and sleep quality
- Weekly and monthly sleep statistics with trend analysis

### Smart Sleep Calculator
- Intelligent sleep time recommendations based on user preferences
- Customized wake-up time calculator accounting for sleep cycles
- Integration with the alarm system for seamless sleep scheduling

### Visual Graphs and Quality Indicators
- Interactive sleep duration charts showing nightly, weekly, and monthly patterns
- Sleep quality visualization with color-coded indicators
- Sleep cycle estimation graphs
- Progress tracking toward sleep goals with visual benchmarks
- Data export capabilities for sharing with healthcare providers

### User Management and Personalized Recommendations
- Secure Firebase authentication with email/password login
- Customizable sleep goals based on individual needs
- Personalized sleep hygiene recommendations based on tracked data
- Smart notifications for optimal bedtime reminders
- Sleep environment optimization suggestions
- Tailored reports highlighting improvement opportunities

## Technologies

- React 19 + Vite for fast, modern frontend development
- Firebase for authentication, database, and generative AI
- Recharts for responsive data visualization
- Custom carousel implementation for UI components
- Local storage caching for optimized performance
- Dark/light theme support with CSS variables
- Mobile-first responsive design principles

## Getting Started

1. Clone the repository
   ```
   git clone https://github.com/yourusername/restful-sleep-tracker.git
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up Firebase
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Set up Firestore Database
   - Configure Firebase GenAI
   - Add your Firebase configuration to `firebase-config.js`

4. Start the development server
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Project Structure
