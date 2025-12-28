import { ReactNode } from 'react';
import { Search, BarChart3, Database, Moon, Sun, Hotel } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LayoutProps {
  children: ReactNode;
  currentView: 'search' | 'leads' | 'analytics';
  onViewChange: (view: 'search' | 'leads' | 'analytics') => void;
}

export const Layout = ({ children, currentView, onViewChange }: LayoutProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Hotel className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Hotel Prospecting
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Lead Intelligence Dashboard
                  </p>
                </div>
              </div>

              <div className="hidden md:flex items-center space-x-1">
                <button
                  onClick={() => onViewChange('search')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'search'
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Search className="w-4 h-4 inline-block mr-2" />
                  Search
                </button>
                <button
                  onClick={() => onViewChange('leads')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'leads'
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Database className="w-4 h-4 inline-block mr-2" />
                  Leads
                </button>
                <button
                  onClick={() => onViewChange('analytics')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'analytics'
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline-block mr-2" />
                  Analytics
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
