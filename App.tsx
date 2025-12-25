import React, { useState, useEffect } from 'react';
import { User, Task, Priority } from './types';
import { storageService } from './services/storage';
import { geminiService } from './services/geminiService';
import { TaskItem } from './components/TaskItem';
import { Button } from './components/Button';
import { LogOut, Plus, Sparkles, Layout, ShieldCheck } from 'lucide-react';

// Simple Auth Component defined in file for cohesion
const AuthScreen: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let user: User;
      if (isRegistering) {
        if (!name) throw new Error("Name is required");
        user = await storageService.register(email, password, name);
      } else {
        user = await storageService.login(email, password);
      }
      onLogin(user);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
             <Layout className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">SmartTasker</h1>
          <p className="text-gray-500">AI-Powered Productivity</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" isLoading={loading}>
            {isRegistering ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600">
          {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-indigo-600 font-medium hover:underline"
          >
            {isRegistering ? 'Log in' : 'Sign up'}
          </button>
        </div>
        
        <div className="pt-4 border-t text-xs text-gray-400 text-center">
          <ShieldCheck className="w-4 h-4 inline mr-1" />
          Secure Local Simulation. Your data is isolated.
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isPrioritizing, setIsPrioritizing] = useState(false);

  // Initialize Auth
  useEffect(() => {
    const currentUser = storageService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      loadTasks(currentUser.id);
    } else {
      setLoading(false);
    }
  }, []);

  const loadTasks = async (userId: string) => {
    setLoading(true);
    try {
      const data = await storageService.getTasks(userId);
      setTasks(data);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (user: User) => {
    setUser(user);
    loadTasks(user.id);
  };

  const handleLogout = async () => {
    await storageService.logout();
    setUser(null);
    setTasks([]);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !user) return;

    try {
      const task = await storageService.createTask(user.id, newTaskTitle);
      setTasks(prev => [...prev, task]);
      setNewTaskTitle('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    if (!user) return;
    try {
      const saved = await storageService.updateTask(user.id, updatedTask);
      setTasks(prev => prev.map(t => t.id === saved.id ? saved : t));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!user) return;
    try {
      await storageService.deleteTask(user.id, id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleAIPrioritize = async () => {
    if (!user || tasks.length === 0) return;
    setIsPrioritizing(true);
    try {
      // Only prioritize uncompleted tasks
      const activeTasks = tasks.filter(t => !t.isCompleted);
      const suggestions = await geminiService.prioritizeTasks(activeTasks);
      
      const newTasks = [...tasks];
      suggestions.forEach(suggestion => {
        const index = newTasks.findIndex(t => t.id === suggestion.id);
        if (index !== -1) {
          newTasks[index] = { ...newTasks[index], priority: suggestion.priority };
          // In a real app we might show the reasoning in a tooltip
        }
      });
      
      // Sort: High -> Medium -> Low
      const priorityOrder = { [Priority.HIGH]: 0, [Priority.MEDIUM]: 1, [Priority.LOW]: 2 };
      newTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      // Bulk update locally for demo speed
      newTasks.forEach(t => storageService.updateTask(user.id, t));
      setTasks(newTasks);
    } finally {
      setIsPrioritizing(false);
    }
  };

  if (!user) {
    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    return <AuthScreen onLogin={handleLogin} />;
  }

  const activeTasks = tasks.filter(t => !t.isCompleted);
  const completedTasks = tasks.filter(t => t.isCompleted);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layout className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold">SmartTasker</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 hidden sm:block">
              Welcome, <span className="font-semibold text-gray-900">{user.name}</span>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* Input Area */}
        <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <form onSubmit={handleCreateTask} className="flex gap-4">
            <input
              type="text"
              placeholder="What needs to be done?"
              className="flex-1 text-lg px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
            />
            <Button type="submit" disabled={!newTaskTitle.trim()} className="px-6 rounded-xl">
              <Plus className="w-5 h-5 mr-2" />
              Add
            </Button>
          </form>
        </section>

        {/* Action Bar */}
        <section className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">My Tasks ({activeTasks.length})</h2>
          <Button 
            variant="secondary" 
            onClick={handleAIPrioritize}
            isLoading={isPrioritizing}
            disabled={activeTasks.length === 0}
            className="text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Prioritize
          </Button>
        </section>

        {/* Task List */}
        <section className="space-y-4">
          {activeTasks.length === 0 && completedTasks.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
              <div className="text-gray-400 mb-2">No tasks yet</div>
              <div className="text-sm text-gray-500">Add a task above to get started</div>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onUpdate={handleUpdateTask} 
                  onDelete={handleDeleteTask} 
                />
              ))}
            </div>
          )}
        </section>

        {/* Completed Section */}
        {completedTasks.length > 0 && (
          <section className="pt-8 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Completed</h3>
            <div className="space-y-3 opacity-60">
              {completedTasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onUpdate={handleUpdateTask} 
                  onDelete={handleDeleteTask} 
                />
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
};

export default App;
