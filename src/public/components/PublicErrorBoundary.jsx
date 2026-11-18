import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, RotateCcw } from 'lucide-react';

export default class PublicErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Public Error caught by boundary:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      sessionStorage.removeItem('alfalah_multistep_draft_v1');
    } catch (e) {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4 font-sans select-none">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center border border-amber-200">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Terjadi Kendala Tampilan
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Halaman mengalami kendala teknis saat memuat data. Anda dapat menyegarkan kembali formulir tanpa kehilangan data penting.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 text-xs">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-[#075B45] hover:bg-[#054736] text-white font-bold shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Segarkan Halaman</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Mulai Ulang Formulir</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
