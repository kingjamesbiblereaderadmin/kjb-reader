import React, { useState, useEffect } from 'react';
import { Mic, Gauge, Repeat } from 'lucide-react';

// The Web Speech API doesn't expose voice gender, so infer it from the voice
// name. These cover common female/male voice names across OSes/browsers.
const FEMALE_HINTS = ['female', 'woman', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'fiona', 'serena', 'allison', 'ava', 'susan', 'zira', 'hazel', 'catherine', 'linda', 'heather', 'sandy', 'shelley', 'google uk english female', 'google us english'];
const MALE_HINTS = ['male', 'man', 'daniel', 'alex', 'fred', 'thomas', 'oliver', 'aaron', 'arthur', 'david', 'mark', 'george', 'james', 'gordon', 'lee', 'google uk english male'];

const voiceGender = (v) => {
  const n = (v.name || '').toLowerCase();
  if (FEMALE_HINTS.some(h => n.includes(h))) return 'female';
  if (MALE_HINTS.some(h => n.includes(h))) return 'male';
  return 'unknown';
};

const SPEEDS = [
  { label: 'Slow', value: 0.75 },
  { label: 'Normal', value: 1 },
  { label: 'Fast', value: 1.5 },
];

// Read Aloud (text-to-speech) settings — mirrors the reader's controls and
// writes the same localStorage keys (kjb-tts-voice, kjb-tts-rate,
// kjb-tts-autoadvance) so changes apply everywhere.
export default function ReadAloudSettings() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [voices, setVoices] = useState([]);
  const [genderFilter, setGenderFilter] = useState('all');
  const [voiceURI, setVoiceURI] = useState(() => {
    try { return localStorage.getItem('kjb-tts-voice') || ''; } catch { return ''; }
  });
  const [rate, setRate] = useState(() => {
    try { return parseFloat(localStorage.getItem('kjb-tts-rate') || '1'); } catch { return 1; }
  });
  const [autoAdvance, setAutoAdvance] = useState(() => {
    try { return localStorage.getItem('kjb-tts-autoadvance') === 'true'; } catch { return false; }
  });

  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(
      (window.speechSynthesis.getVoices() || []).filter(v => /^en(-|_|$)/i.test(v.lang || ''))
    );
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [supported]);

  if (!supported) {
    return (
      <div className="p-5 pt-0">
        <p className="font-sans text-sm text-muted-foreground">Read Aloud is not supported in this browser.</p>
      </div>
    );
  }

  const filteredVoices = genderFilter === 'all'
    ? voices
    : voices.filter(v => voiceGender(v) === genderFilter);

  const changeVoice = (uri) => {
    setVoiceURI(uri);
    try { localStorage.setItem('kjb-tts-voice', uri); } catch {}
  };
  const changeRate = (r) => {
    setRate(r);
    try { localStorage.setItem('kjb-tts-rate', String(r)); } catch {}
  };
  const toggleAutoAdvance = () => {
    setAutoAdvance(prev => {
      const next = !prev;
      try { localStorage.setItem('kjb-tts-autoadvance', String(next)); } catch {}
      return next;
    });
  };

  return (
    <div className="p-5 pt-0 space-y-5">
      {/* Speed */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-muted-foreground" />
          <p className="font-sans text-sm text-foreground font-medium">Speed</p>
        </div>
        <div className="flex gap-2">
          {SPEEDS.map(s => (
            <button
              key={s.value}
              onClick={() => changeRate(s.value)}
              className={`flex-1 px-2 py-2.5 rounded-lg font-sans text-sm font-medium transition-all ${
                rate === s.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Continue to next chapter */}
      <button
        onClick={toggleAutoAdvance}
        className={`w-full flex items-center justify-between gap-2 px-3 py-3 rounded-lg font-sans text-sm font-medium transition-all ${
          autoAdvance ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
        }`}
      >
        <span className="flex items-center gap-2">
          <Repeat className="w-4 h-4" />
          Continue to next chapter
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${autoAdvance ? 'bg-primary-foreground/20' : 'bg-background'}`}>
          {autoAdvance ? 'ON' : 'OFF'}
        </span>
      </button>

      {/* Voice picker */}
      {voices.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-muted-foreground" />
            <p className="font-sans text-sm text-foreground font-medium">Voice</p>
          </div>
          {/* Gender filter */}
          <div className="flex gap-2">
            {[
              { label: 'All', value: 'all' },
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
            ].map(g => (
              <button
                key={g.value}
                onClick={() => setGenderFilter(g.value)}
                className={`flex-1 px-2 py-2 rounded-lg font-sans text-xs font-medium transition-all ${
                  genderFilter === g.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <select
            value={voiceURI}
            onChange={(e) => changeVoice(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground font-sans text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Default voice</option>
            {filteredVoices.map(v => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
          {filteredVoices.length === 0 && (
            <p className="font-sans text-xs text-muted-foreground">No {genderFilter} voices detected on this device.</p>
          )}
        </div>
      )}
    </div>
  );
}