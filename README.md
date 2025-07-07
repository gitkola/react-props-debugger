# React Props Debugger

A development tool for debugging React component props and performance metrics via long-press interaction.

## Features

- 🔍 **Long-press Detection**: Long-press any React component to inspect its props
- 📊 **Performance Metrics**: View render counts and timing information
- 🎨 **DOM Inspector**: Examine element styles, dimensions, and positioning
- 🌳 **Component Hierarchy**: See parent components and full component paths
- 📱 **Touch & Mouse Support**: Works on both desktop and mobile devices
- 🚀 **Zero Config**: Just import and start debugging

## Installation

```bash
npm install --save-dev react-props-debugger
```

or

```bash
yarn add -D react-props-debugger
```

## Usage

Simply import the package at the top of your application entry point:

```typescript
// main.tsx or index.tsx
import 'react-props-debugger';

// Your app code...
```

The debugger will automatically initialize in development mode only.

## How It Works

1. **Long-press** (hold for 500ms) any element in your React app
2. A popup will appear showing:
   - **Props tab**: All component props in JSON format
   - **DOM tab**: Element information, positioning, and styles
   - **Performance tab**: Render counts and React fiber information
3. Click outside the popup to close it

## Features in Detail

### Props Inspector

- View all props passed to the component
- Functions shown as `[Function: name]`
- React elements shown as `[React.Element: type]`

### DOM Inspector

- Element type, classes, and ID
- Position and dimensions
- Display properties and z-index
- Margin, padding, and border information

### Performance Metrics

- Render count tracking
- Last render timestamp
- React fiber information
- State and hooks detection

## Configuration

The debugger runs automatically in development mode. No configuration needed!

## Browser Support

- ✅ Chrome, Edge, Brave (Chromium-based browsers)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Android)

### Build & Publish:

```bash
npm install
npm run build
npm publish
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
