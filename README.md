# CNC Master

**CNC Master** is a modern web-based learning platform for CNC G-code simulation.  
It helps beginners understand how G-code drives tool motion by combining a structured editor, diagnostics, and a 3D machining preview in a clean browser experience.

This project is designed as an educational simulator first: approachable, visual, and maintainable, with a codebase structured for future expansion into more realistic CNC behavior.

## Demo

Live demo: `https://your-demo-link.vercel.app`

## Screenshots

Add screenshots here:

- `docs/screenshots/home.png`
- `docs/screenshots/editor-and-diagnostics.png`
- `docs/screenshots/3d-simulation.png`

Example markdown:

```md
![CNC Master Home](docs/screenshots/home.png)
![Editor and Diagnostics](docs/screenshots/editor-and-diagnostics.png)
![3D Simulation](docs/screenshots/3d-simulation.png)
```

## Features

- Define a rectangular raw workpiece with configurable `X`, `Y`, and `Z` dimensions
- Select material type for the learning context:
  - aluminum
  - steel
  - plastic
  - wood
- Configure a basic milling tool for the MVP:
  - flat end mill
  - diameter
  - flute length
  - total length
  - tool number
  - spindle speed
  - feed rate
- Edit G-code in-browser with Monaco Editor
- Parse common CNC commands including:
  - `G0`, `G1`
  - `G2`, `G3` as MVP-stubbed/simplified arc commands
  - `F`, `S`, `T`
  - `M3`, `M5`
  - `G90`, `G91`
  - `G20`, `G21`
- Visualize the workpiece, toolpath, and tool movement in 3D using React Three Fiber / Three.js
- Distinguish rapid moves and cutting moves visually
- Animate tool motion with play, pause, reset, and speed controls
- Show parser diagnostics and beginner-focused safety warnings with line numbers
- Explain selected G-code lines in simple German for learning support

## Tech Stack

- **Next.js**
- **TypeScript**
- **React**
- **Tailwind CSS**
- **React Three Fiber / Three.js**
- **Monaco Editor**
- **Zustand** for local state management

## Local Development

### Prerequisites

- Node.js 18+ recommended
- npm

### Run locally

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

### Production build

```bash
npm run build
npm run start
```

## Project Structure

```text
app/                  Next.js app router entrypoints and global styles
components/           UI panels, editor, and 3D viewer components
lib/cnc/              CNC domain logic: parser, validation, simulation, types
lib/data/             Learning/reference content and sample G-code
lib/state/            Local application state
public/               Static assets
```

## MVP Limitations

Current scope is intentionally limited to keep the simulator stable, understandable, and beginner-friendly.

- Flat end mill only
- Rectangular stock only
- No backend in the MVP
- No saved projects or accounts yet
- No machine-specific controller profiles yet
- `G2` / `G3` arc handling is simplified
- Material removal is visual approximation only
- Collision and crash checks are approximate, not physically complete
- No fixture, vice, clamp, holder, or spindle-body collision simulation
- No certified machining physics, chip load, or force model

## Safety Disclaimer

**CNC Master is an educational simulator. It is not certified CNC verification software.**

Do **not** use this project as the sole basis for real machining safety decisions, production verification, collision clearance, or machine setup approval.

All simulations, warnings, and toolpath previews in the current MVP are intended for learning and experimentation only. Real-world CNC machining requires qualified review, machine-specific validation, safe setup practices, and professional verification procedures.

## Roadmap

Planned areas of improvement include:

- Improved `G2` / `G3` arc interpolation and rendering
- Better diagnostics and rule-based validation architecture
- Stronger crash and boundary detection
- More realistic material removal preview
- Support for additional tool types
- Machine profiles and controller-specific behavior
- Saved projects and user accounts
- Guided lessons and tutorials
- AI-assisted G-code explanations and feedback

## Contribution

Contributions, ideas, and feedback are welcome.

If you want to contribute:

1. Fork the repository
2. Create a feature branch
3. Make focused, well-documented changes
4. Run the build locally before opening a pull request
5. Open a PR with a clear summary of the problem and solution

For larger architectural changes, it is best to open an issue first so the direction can be discussed before implementation.

## Deployment

The app is deployed and working on Vercel.

Deployment details and environment-specific notes can be documented here later if needed.

## License

License: `TBD`

If you plan to open source the project publicly, replace this section with your chosen license, for example `MIT`, `Apache-2.0`, or a proprietary license notice.
