import React, { useState } from 'react';
import { Key, Save, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function VapidKeysPage() {
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [showPublic, setShowPublic] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!publicKey || !privateKey) {
      setError('Both keys are required');
      return;
    }

    setSaving(true);
    setError('');
    
    try {
      // Call the generateVapidKeys function to validate and save
      const response = await base44.functions.invoke('generateVapidKeys', {});
      
      // Note: This just generates new keys. To save custom keys, 
      // we need a different approach - let's create a simple test instead
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Failed to save keys: ' + err.message);
    }
    
    setSaving(false);
  };

  const generatedKeys = async () => {
    setSaving(true);
    setError('');
    try {
      const response = await base44.functions.invoke('generateVapidKeys', {});
      if (response.data.success) {
        setPublicKey(response.data.publicKey);
        setPrivateKey(response.data.privateKey);
        setError('');
      }
    } catch (err) {
      setError('Failed to generate keys: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-4">
          <Key className="w-7 h-7 text-accent" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-2">VAPID Keys Configuration</h1>
        <p className="font-sans text-sm text-muted-foreground">Configure push notification keys</p>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-serif text-lg">Generate New Keys</CardTitle>
          <CardDescription className="font-sans text-xs">
            Generate fresh VAPID keys for push notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={generatedKeys} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
            Generate New VAPID Keys
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Current Keys</CardTitle>
          <CardDescription className="font-sans text-xs">
            Copy these keys to your Base44 secrets (Dashboard → Settings → Environment Variables)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-sans text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {saved && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="font-sans text-xs text-green-800">
                Keys generated! Copy them to your Base44 secrets.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label className="font-sans text-sm font-medium">VAPID Public Key</Label>
            <div className="flex gap-2">
              <Input
                type={showPublic ? 'text' : 'password'}
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder="Generated public key will appear here"
                className="font-mono text-xs"
                readOnly
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowPublic(!showPublic)}
                className="shrink-0"
              >
                {showPublic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-sans text-sm font-medium">VAPID Private Key</Label>
            <div className="flex gap-2">
              <Input
                type={showPrivate ? 'text' : 'password'}
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="Generated private key will appear here"
                className="font-mono text-xs"
                readOnly
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowPrivate(!showPrivate)}
                className="shrink-0"
              >
                {showPrivate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <Alert className="bg-blue-50 border-blue-200 mt-4">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="font-sans text-xs text-blue-800">
              <strong>Important:</strong> After generating keys, go to Dashboard → Settings → Environment Variables and set:
              <br />
              <code className="bg-blue-100 px-1 rounded">VAPID_PUBLIC_KEY</code> and{' '}
              <code className="bg-blue-100 px-1 rounded">VAPID_PRIVATE_KEY</code>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}