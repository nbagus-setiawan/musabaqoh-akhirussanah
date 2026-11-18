import React, { Component } from 'react';
import AdminApp from '../admin/AdminApp';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Admin Panel Error caught by boundary:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans">
          <div className="max-w-md w-full bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Terjadi Kendala di Panel Admin</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {this.state.error?.message || 'Terjadi kesalahan sistem saat memuat antarmuka.'}
              </p>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-600 font-semibold text-xs text-slate-300 hover:bg-slate-700 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Ke Beranda</span>
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Muat Ulang</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function AdminPage() {
  return (
    <AdminErrorBoundary>
      <AdminApp />
    </AdminErrorBoundary>
  );
}
