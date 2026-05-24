import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { WritingProvider } from './stores/writing-store';
import WritingStudio from './pages/WritingStudio';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <WritingProvider>
          <WritingStudio />
        </WritingProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
