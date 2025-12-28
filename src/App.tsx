import { useState } from 'react';
import { Layout } from './components/Layout';
import { SearchModule } from './components/SearchModule';
import { LeadsTable } from './components/LeadsTable';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';

type View = 'search' | 'leads' | 'analytics';

function App() {
  const [currentView, setCurrentView] = useState<View>('search');

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {currentView === 'search' && <SearchModule />}
      {currentView === 'leads' && <LeadsTable />}
      {currentView === 'analytics' && <AnalyticsDashboard />}
    </Layout>
  );
}

export default App;
