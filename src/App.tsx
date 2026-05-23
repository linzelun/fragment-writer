import { WritingProvider } from './stores/writing-store';
import WritingStudio from './pages/WritingStudio';

export default function App() {
  return (
    <WritingProvider>
      <WritingStudio />
    </WritingProvider>
  );
}
