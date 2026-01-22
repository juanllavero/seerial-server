![Seerial Banner](public/img/banner.svg)

# Seerial Web Client

A modern web client for the Seerial Media Server, providing a sleek and responsive interface for managing and streaming your multimedia library.

## Overview

Seerial Web Client is the frontend application that connects to the Seerial Media Server API. It offers a user-friendly interface for browsing, searching, and playing movies, TV series, music, and other media content.

## Features

- **Media Browsing**: Browse your media library with intuitive navigation and search capabilities
- **Video Playback**: Integrated video player with support for various formats
- **Audio Playback**: Music player with playlist support
- **Responsive Design**: Optimized for desktop and mobile devices
- **Multi-language Support**: Internationalization with multiple language options
- **Modern UI**: Clean, accessible interface built with modern design principles

## Technologies

- **React 19**: Modern JavaScript library for building user interfaces
- **TypeScript**: Type-safe JavaScript for better development experience
- **Vite**: Fast build tool and development server
- **Zustand**: Lightweight state management solution
- **SWR**: React hooks for data fetching with caching and revalidation
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Unstyled, accessible UI components
- **React Router DOM**: Declarative routing for React
- **i18next**: Internationalization framework
- **Video.js**: Web video player
- **Lucide React**: Beautiful & consistent icon toolkit
- **shadcn/ui**: Re-usable components built on Radix UI and Tailwind CSS

## Getting Started

This web client is part of the Seerial Media Server project. To run the complete application, follow the setup instructions in the main [README](../README.md).

### Prerequisites

- Node.js (v16+)
- pnpm (recommended) or npm

### Installation

1. Navigate to the seerial-web directory:

   ```bash
   cd seerial-web
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

### Development

Start the development server:

```bash
pnpm run dev
```

This will start the Vite development server with hot module replacement.

### Building

Build for production:

```bash
pnpm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

Preview the production build locally:

```bash
pnpm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── cards/          # Media card components
│   ├── dialogs/        # Modal dialogs
│   ├── form/           # Form components
│   ├── lists/          # List components
│   ├── musicPlayer/    # Audio player components
│   ├── SideBar/        # Sidebar navigation
│   └── skeletons/      # Loading skeleton components
├── config/             # Configuration files
├── context/            # React context providers
├── data/               # Data models and types
├── helpers/            # Utility functions
├── hooks/              # Custom React hooks
├── layouts/            # Page layout components
├── localization/       # Internationalization files
├── pages/              # Page components
├── routes/             # Routing configuration
├── styles/             # Global styles and Tailwind config
├── types/              # TypeScript type definitions
└── utils/              # Additional utilities
```

## Contributing

Contributions are welcome! Please refer to the main project's contribution guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.
