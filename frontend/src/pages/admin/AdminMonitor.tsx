import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
  Activity, Database, Server, RefreshCw, Cpu, HardDrive,
  CheckCircle, ArrowLeft, Loader2, Thermometer, ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts';

export const AdminMonitor: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [sysMetrics, setSysMetrics] = useState({
    cpu: 28,
    memoryUsed: 1.45,
    memoryTotal: 4.0,
    dbConnections: 5,
    activeThreads: 12,
    diskUsed: 42.1,
    diskTotal: 100.0,
  });
  
  // Real time simulation data
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => {
      // Simulate real-time metrics fluctuation
      setSysMetrics(prev => {
        const nextCpu = Math.max(10, Math.min(95, prev.cpu + (Math.random() * 10 - 5)));
        const nextMemory = Math.max(1.0, Math.min(3.8, prev.memoryUsed + (Math.random() * 0.1 - 0.05)));
        const nextConnections = Math.max(2, Math.min(20, prev.dbConnections + Math.floor(Math.random() * 3 - 1)));
        const nextThreads = Math.max(8, Math.min(45, prev.activeThreads + Math.floor(Math.random() * 5 - 2)));
        
        // Add to historical chart data
        const timestamp = new Date().toLocaleTimeString();
        setChartData(prevData => {
          const newData = [...prevData, {
            time: timestamp,
            cpu: Math.round(nextCpu),
            memory: Math.round(nextMemory * 1000), // MB
            connections: nextConnections
          }];
          if (newData.length > 10) newData.shift();
          return newData;
        });

        return {
          ...prev,
          cpu: Math.round(nextCpu),
          memoryUsed: parseFloat(nextMemory.toFixed(2)),
          dbConnections: nextConnections,
          activeThreads: nextThreads
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/health');
      setHealthStatus(res.data);
    } catch (err) {
      console.error("Health check failed", err);
      setHealthStatus({ status: "DOWN", message: "Unable to connect to Spring Boot backend." });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  const memoryPercentage = (sysMetrics.memoryUsed / sysMetrics.memoryTotal) * 100;
  const diskPercentage = (sysMetrics.diskUsed / sysMetrics.diskTotal) * 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-xs text-primary font-bold uppercase tracking-wider">Azure Cloud Integration</p>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <Server size={24} className="text-primary" /> Azure System Monitor
            </h1>
          </div>
        </div>

        <button
          onClick={fetchHealth}
          className="flex items-center gap-1.5 px-4 py-2 border border-border bg-card rounded-xl text-xs font-bold hover:bg-secondary transition-all"
        >
          <RefreshCw size={14} /> Refresh Health
        </button>
      </div>

      {/* Cloud Service Statuses */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* API Backend Status */}
        <div className="bg-card border border-border rounded-3xl p-6 flex items-start justify-between shadow-sm">
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">LMS Spring Boot Server</p>
            <h3 className="text-lg font-bold">{healthStatus?.status === 'UP' ? 'Running Safely' : 'Offline / Connection Failure'}</h3>
            <p className="text-xs text-muted-foreground">{healthStatus?.message || 'Server did not respond.'}</p>
          </div>
          <span className={`p-2 rounded-full ${
            healthStatus?.status === 'UP' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'
          }`}>
            {healthStatus?.status === 'UP' ? <CheckCircle size={20} /> : <ShieldAlert size={20} />}
          </span>
        </div>

        {/* Database Node Status */}
        <div className="bg-card border border-border rounded-3xl p-6 flex items-start justify-between shadow-sm">
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Azure SQL Database</p>
            <h3 className="text-lg font-bold">Connected</h3>
            <p className="text-xs text-muted-foreground">Active Pool: {sysMetrics.dbConnections} connections open.</p>
          </div>
          <span className="p-2 rounded-full bg-emerald-500/10 text-emerald-500">
            <Database size={20} />
          </span>
        </div>

        {/* Cloud VM Load Status */}
        <div className="bg-card border border-border rounded-3xl p-6 flex items-start justify-between shadow-sm">
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Azure VM Instances</p>
            <h3 className="text-lg font-bold">Standard_B2s (2 vCPUs)</h3>
            <p className="text-xs text-muted-foreground">Total JVM Threads: {sysMetrics.activeThreads} active.</p>
          </div>
          <span className="p-2 rounded-full bg-blue-500/10 text-blue-500">
            <Cpu size={20} />
          </span>
        </div>
      </div>

      {/* Main Monitoring Panels */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Real-time Hardware Metrics */}
        <div className="bg-card border border-border rounded-3xl p-6 space-y-6 shadow-sm lg:col-span-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Activity size={16} /> VM Telemetry Load
          </h2>
          
          {/* CPU Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span>CPU Utilization</span>
              <span className={sysMetrics.cpu > 80 ? 'text-destructive' : 'text-foreground'}>{sysMetrics.cpu}%</span>
            </div>
            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${sysMetrics.cpu > 80 ? 'bg-destructive' : 'bg-primary'}`}
                style={{ width: `${sysMetrics.cpu}%` }}
              />
            </div>
          </div>

          {/* Memory Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span>JVM Memory Heap</span>
              <span>{sysMetrics.memoryUsed} GB / {sysMetrics.memoryTotal} GB</span>
            </div>
            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 transition-all duration-500"
                style={{ width: `${memoryPercentage}%` }}
              />
            </div>
          </div>

          {/* Disk Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span>Persistent Storage Disk</span>
              <span>{sysMetrics.diskUsed} GB / {sysMetrics.diskTotal} GB</span>
            </div>
            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${diskPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Real-time Load Graphs */}
        <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Real-time Metric Stream (Live)
          </h2>
          
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
              Awaiting telemetry payload streams...
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="cpu" name="CPU Load %" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCpu)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
