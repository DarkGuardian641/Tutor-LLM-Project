import Sidebar from './components/Sidebar';
import Chatbot from './pages/Chatbot';
import './styles/App.css';

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="app-main">
        <Chatbot />
      </main>
    </div>
  );
}

export default App;
