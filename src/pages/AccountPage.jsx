import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserCircle, Trash2, Loader2, LogOut, ChevronLeft, Shield, Bookmark, TrendingUp, Cloud } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') return;
    setDeletingAccount(true);
    try {
      await base44.functions.invoke('deleteUserAccount', {});
      await base44.auth.logout('/');
    } catch (err) {
      setDeletingAccount(false);
      toast.error('Could not delete account: ' + (err?.message || 'Please contact support.'));
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await base44.auth.logout('/landing');
    } catch (err) {
      setSigningOut(false);
      toast.error('Sign out failed: ' + (err?.message || 'Please try again.'));
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-primary/70" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-2xl mx-auto px-5 sm:px-8 lg:px-12 pt-10 pb-32 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30 mb-4">
          <UserCircle className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Account</h1>
        <p className="font-sans text-sm text-muted-foreground mb-6">Sign in to sync your saved verses, reading progress, and settings across devices.</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-transparent border border-border text-foreground font-sans text-sm font-medium hover:border-accent transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-5 sm:px-8 lg:px-12 pt-10 pb-32">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30 mb-4">
          <UserCircle className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Account</h1>
        <p className="font-sans text-sm text-muted-foreground">Manage your account and data</p>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
      </div>

      {/* Profile card */}
      <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl mb-5 p-5 shadow-lg shadow-black/[0.03]">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-primary to-accent">
            <UserCircle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-sans font-medium text-sm text-foreground truncate">{user?.email || 'Signed in'}</p>
            <p className="font-sans text-xs text-muted-foreground capitalize">{user?.role || 'user'}</p>
          </div>
        </div>
      </div>

      {/* Sync info */}
      <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl mb-5 p-5 shadow-lg shadow-black/[0.03]">
        <h2 className="font-serif text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Cloud className="w-4 h-4 text-primary" />
          Cloud Sync
        </h2>
        <p className="font-sans text-sm text-muted-foreground mb-4 leading-relaxed">
          Your data is securely synced to your account so you can access it on any device.
        </p>
        <div className="space-y-3">
          <Link
            to="/saved"
            className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border hover:border-accent transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-white shadow-sm bg-gradient-to-br from-fuchsia-500 to-pink-600">
              <Bookmark className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Saved Verses</p>
              <p className="font-sans text-xs text-muted-foreground">Your bookmarked verses and folders</p>
            </div>
            <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180" />
          </Link>
          <Link
            to="/read"
            className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border hover:border-accent transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-white shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Reading Progress</p>
              <p className="font-sans text-xs text-muted-foreground">Synced across all your devices</p>
            </div>
            <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180" />
          </Link>
        </div>
      </div>

      {/* Sign out */}
      <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl mb-5 p-5 shadow-lg shadow-black/[0.03]">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-transparent border border-border text-foreground font-sans text-sm font-medium hover:border-accent transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
        >
          {signingOut ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Signing out...</>
          ) : (
            <><LogOut className="w-4 h-4" /> Sign Out</>
          )}
        </button>
      </div>

      {/* Danger zone */}
      <div className="bg-card/70 backdrop-blur-xl border border-red-200 dark:border-red-900/30 rounded-2xl mb-5 p-5 shadow-lg shadow-black/[0.03]">
        <h2 className="font-serif text-lg font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Danger Zone
        </h2>
        <p className="font-sans text-xs text-red-600/70 dark:text-red-400/70 mb-4 leading-relaxed">
          Permanently erase all your saved verses, reading progress, and synced settings. This action <strong>cannot be undone</strong>.
        </p>
        {showDeleteConfirm ? (
          <div className="space-y-3">
            <p className="font-sans text-xs text-foreground/80">
              Type <strong className="text-red-600 dark:text-red-400">DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border font-sans text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setDeleteInput(''); setShowDeleteConfirm(false); }}
                disabled={deletingAccount}
                className="flex-1 px-4 py-2.5 rounded-xl bg-transparent border border-border text-foreground font-sans text-sm font-medium hover:bg-secondary transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount || deleteInput !== 'DELETE'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-sans text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {deletingAccount ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
                ) : (
                  <><Trash2 className="w-4 h-4" /> Delete Forever</>
                )}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-transparent border border-destructive text-destructive font-sans text-sm font-medium hover:bg-destructive/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] w-full"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        )}
      </div>
    </div>
  );
}