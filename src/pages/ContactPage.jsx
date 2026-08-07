import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';

const EMAIL = 'kingjamesbiblereader@outlook.sg';

export default function ContactPage() {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-accent/5 to-background overflow-hidden">
      {/* Decorative ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 py-10 pb-24">
        {/* Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationFillMode: 'both' }}>
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/30 to-purple-600/30 blur-xl" />
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Contact Us</h1>
          <p className="font-sans text-sm text-muted-foreground">We'd love to hear from you</p>
          <div className="mt-4 w-16 h-px bg-accent mx-auto" />
        </div>

        <div className="text-center mb-6 animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationDelay: '60ms', animationFillMode: 'both' }}>
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent border border-border text-foreground font-sans text-sm font-medium hover:border-accent hover:bg-accent/5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        <div className="relative overflow-hidden bg-card/70 backdrop-blur-xl border-2 border-border/60 rounded-3xl p-6 sm:p-8 shadow-lg shadow-black/[0.03] text-center animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationDelay: '100ms', animationFillMode: 'both' }}>
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -left-8 -bottom-8 w-40 h-40 rounded-full bg-accent/5 blur-3xl" />
          <p className="relative font-sans text-sm text-foreground/85 leading-relaxed mb-6">
            Have a question, feedback, a verse request, or a prayer request? We'd be glad to hear
            from you. Reach out and we'll do our best to respond.
          </p>
          <a
            href={`mailto:${EMAIL}`}
            className="relative inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground font-sans text-base font-semibold shadow-md shadow-primary/20 hover:brightness-105 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
          >
            <Mail className="w-5 h-5" />
            {EMAIL}
          </a>
          <p className="relative font-sans text-xs text-muted-foreground mt-4">
            Or copy: <span className="text-foreground font-medium">{EMAIL}</span>
          </p>
        </div>

        <div className="text-center mt-8 animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationDelay: '140ms', animationFillMode: 'both' }}>
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent border border-border text-foreground font-sans text-sm font-medium hover:border-accent hover:bg-accent/5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>
    </div>
  );
}