<div align="center">

# MahaSagar AI — ORCA Marine Intelligence

An agentic AI marine safety platform for Indian fishermen — built for Smart India Hackathon 2026

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=white)](https://react.dev/) [![Vite](https://img.shields.io/badge/Vite-7.1.5-646CFF?logo=vite&logoColor=white)](https://vite.dev/) [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-UI%20badge-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/) [![Framer Motion](https://img.shields.io/badge/Framer%20Motion-12.23.24-EF008F?logo=framer&logoColor=white)](https://motion.dev/) [![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/) [![SIH 2026](https://img.shields.io/badge/Smart%20India%20Hackathon-2026-orange)](https://www.sih.gov.in/) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

</div>

## Table of Contents

- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Multi-Agent Architecture](#multi-agent-architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Team](#team)
- [Data Sources & Acknowledgments](#data-sources--acknowledgments)
- [License](#license)

## About the Project

MahaSagar AI — ORCA addresses Problem Statement SIH26176 from ISRO, where marine ecosystem information is scattered across difficult-to-access sources and is not presented safely for fishermen. The prototype brings fishing-zone intelligence, weather conditions, alerts, route planning, and emergency support into one focused interface. It combines ten visible specialist agents to turn marine context into clear, explainable guidance. A multilingual conversational layer makes the experience more accessible to coastal communities.

## Key Features

- 🤖 **Multi-agent AI system:** User Interaction & Multilingual, Planning & Orchestration, Marine Data Discovery, Weather Intelligence, Ocean Analytics, Geospatial Reasoning, Risk Assessment & Geofencing, SOS & Emergency Coordination, Visualization, and Reporting & Synthesis.
- 🌐 **Multilingual conversational interface** with English, Hindi, Malayalam, Tamil, and Telugu content and speech output support.
- 🐟 **PFZ map** with fish-potential zones, map-based destination selection, and custom safe route planning.
- 🌦️ **Weather, cyclone, wave, and lightning alerts** with forecast trends and safety factors.
- 🆘 **SOS emergency coordination** with nearby-vessel awareness and Coast Guard alerting controls in the simulated flow.
- 🔎 **Explainable “Why this answer?” trails** through visible agent activity and safety-factor reasoning.
- 👤 **Prototype profile and authentication flow** backed by local browser storage.

## Screenshots

### Home Dashboard

![Home Dashboard](./screenshots/home.png)

### PFZ Map

![PFZ Map](./screenshots/pfz-map.png)

### SOS Flow

![SOS Flow](./screenshots/sos-flow.png)

### Agent Activity

![Agent Activity](./screenshots/agent-activity.png)

## Tech Stack

| Category | Technology |
| --- | --- |
| UI framework | React 18.3.1, React DOM 18.3.1 |
| Build tool | Vite 7.1.5 with `@vitejs/plugin-react` |
| Styling | CSS (`src/App.css`, component stylesheets, and `src/index.css`) |
| Motion | Framer Motion 12.23.24 |
| Maps | Leaflet 1.9.4 and React Leaflet 4.2.1 |
| Charts | Recharts 3.2.1 |
| Icons | lucide-react 0.468.0 |
| Testing utilities | Testing Library DOM, Jest DOM, React, and User Event |

## Multi-Agent Architecture

The interface visualizes a ten-agent pipeline that moves from user intent to a concise, explainable marine-safety answer:

1. User Interaction & Multilingual
2. Planning & Orchestration
3. Marine Data Discovery
4. Weather Intelligence
5. Ocean Analytics
6. Geospatial Reasoning
7. Risk Assessment & Geofencing
8. SOS & Emergency Coordination
9. Visualization
10. Reporting & Synthesis

![Agent Architecture](./screenshots/agent-architecture.png)

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm

### Installation

```bash
git clone <YOUR_GITHUB_REPO_URL>
cd sih
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

> **Prototype data notice:** All marine, weather, PFZ, vessel, GPS, alert, chat, and explainability data in this prototype is **mocked/simulated** for demonstration purposes. It is not live production data, and the SOS flow does not dispatch a real emergency alert.

## Project Structure

```text
sih/
├── public/                  # Static assets and web manifest
├── src/
│   ├── components/          # AgentPipeline and MapExplorer UI modules
│   ├── context/             # Local authentication context
│   ├── data/                # Mock marine data, user data, and translations
│   ├── App.js               # Main application shell and views
│   ├── App.css              # Application styling
│   ├── index.css            # Global styling
│   └── index.jsx            # React entry point
├── index.html
├── package.json
├── vite.config.js
└── LICENSE
```

## Team

- **Team Name:** BlueMind Agent
- **Problem Statement:** SIH26176 — ORCA: Marine EcOsystem Reasoning with Collaborative Agents
- **Organization:** ISRO — Department of Space
- **Theme:** Space Technology
- **Category:** Software

## Data Sources & Acknowledgments

A production version would integrate INCOIS ERDDAP, Copernicus Marine Service, IMD advisories, and Global Fishing Watch EEZ/MPA data. This prototype uses local mock data modeled on the structure and kinds of information those services can provide. We acknowledge the open marine-data and public-safety ecosystems that make a production ORCA platform possible.

## License

This project is released under the [MIT License](./LICENSE).
