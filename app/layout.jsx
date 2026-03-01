import './globals.css';
import AppShell from './components/AppShell';

export const metadata = {
  title: 'ToolBOX OPS',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
