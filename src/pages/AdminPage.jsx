import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, Bell, Users, Database, RefreshCw, Copy, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatingKeys, setGeneratingKeys] = useState(false);
  const [vapidKeys, setVapidKeys] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [stats, setStats] = useState({
    subscribers: 0,
    totalUsers: 0,
    cacheSize: 0,
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        navigate('/');
        return;
      }
      setIsAdmin(true);
      await loadStats();
    } catch (err) {
      console.error('Auth check failed:', err);
      navigate('/');
    }
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const [subs, users] = await Promise.all([
        base44.entities.PushSubscription.list(),
        base44.entities.User.list(),
      ]);
      setStats({
        subscribers: subs.filter(s => s.active).length,
        totalUsers: users.length,
        cacheSize: 0,
      });
    } catch (err) {
      console.error('Stats load failed:', err);
    }
  };

  const handleGenerateKeys = async () => {
    setGeneratingKeys(true);
    try {
      const response = await base44.functions.invoke('generateVapidKeys', {});
      setVapidKeys(response.data);
    } catch (err) {
      console.error('Key generation failed:', err);
      alert('Failed to generate keys: ' + err.message);
    }
    setGeneratingKeys(false);
  };

  const handleCopy = async (text, label) => {
    await navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1800);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary mb-4">
          <Shield className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="font-sans text-sm text-muted-foreground">System management and configuration</p>
        <div className="mt-4 w-16 h-px bg-primary mx-auto" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-sans text-sm font-medium">Push Subscribers</CardTitle>
            <Bell className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-serif text-2xl font-bold">{stats.subscribers}</div>
            <p className="font-sans text-xs text-muted-foreground">Active push notification subscribers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-sans text-sm font-medium">Total Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-serif text-2xl font-bold">{stats.totalUsers}</div>
            <p className="font-sans text-xs text-muted-foreground">Registered app users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-sans text-sm font-medium">Cache Status</CardTitle>
            <Database className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-serif text-2xl font-bold">Active</div>
            <p className="font-sans text-xs text-muted-foreground">Bible cache operational</p>
          </CardContent>
        </Card>
      </div>

      {/* VAPID Keys Section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-serif text-xl">VAPID Keys Configuration</CardTitle>
              <CardDescription className="font-sans text-sm">
                Generate and configure VAPID keys for push notifications
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="font-sans text-sm">
              VAPID keys are used for web push notifications. After generating keys, add them to your Base44 secrets:
              <br />
              <code className="font-mono text-xs bg-secondary px-2 py-1 rounded mt-2 inline-block">
                VAPID_PUBLIC_KEY
              </code>
              {' '}and{' '}
              <code className="font-mono text-xs bg-secondary px-2 py-1 rounded">
                VAPID_PRIVATE_KEY
              </code>
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleGenerateKeys}
            disabled={generatingKeys}
            className="w-full flex items-center gap-2"
          >
            {generatingKeys ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Generate New VAPID Keys
              </>
            )}
          </Button>

          {vapidKeys && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-sans text-sm font-medium text-foreground">
                    Public Key (VAPID_PUBLIC_KEY)
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(vapidKeys.publicKey, 'Public Key')}
                    className="flex items-center gap-1.5 h-8 text-xs"
                  >
                    {copyFeedback ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={vapidKeys.publicKey}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border font-mono text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-sans text-sm font-medium text-foreground">
                    Private Key (VAPID_PRIVATE_KEY)
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(vapidKeys.privateKey, 'Private Key')}
                    className="flex items-center gap-1.5 h-8 text-xs"
                  >
                    {copyFeedback ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={vapidKeys.privateKey}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border font-mono text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="font-sans text-sm text-green-700 dark:text-green-300">
                  Keys generated successfully! Copy them to your Base44 secrets dashboard.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Quick Actions</CardTitle>
          <CardDescription className="font-sans text-sm">
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/refresh-cache')}
            className="flex items-center gap-2 justify-start"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Bible Cache
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/vapid-keys')}
            className="flex items-center gap-2 justify-start"
          >
            <Key className="w-4 h-4" />
            VAPID Keys Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}