import { useState } from 'react';
import styles from './FilterBar.module.css';

const DATE_PRESETS = ['7d', '30d', '90d', 'Custom'];
const PROVIDERS = ['All Providers', 'AWS'];
const TEAMS = ['All Teams', 'Team Alpha', 'Team Beta', 'Platform', 'Data'];

export default function FilterBar({ onGenerate, loading }) {
  const [datePreset, setDatePreset] = useState('30d');
  const [provider, setProvider] = useState('All Providers');
  const [team, setTeam] = useState('All Teams');

  const handlePresetClick = (p) => {
    setDatePreset(p);
    onGenerate({ datePreset: p, provider, team });
  };

  const handleGenerate = () => {
    onGenerate({ datePreset, provider, team });
  };

  return (
    <div className={styles.filterBar}>
      {/* Date range presets */}
      <div className={styles.dateGroup}>
        {DATE_PRESETS.map((p) => (
          <button
            key={p}
            className={`${styles.presetBtn} ${datePreset === p ? styles.active : ''}`}
            onClick={() => handlePresetClick(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Provider filter */}
      <select
        className={styles.select}
        value={provider}
        onChange={(e) => {
          setProvider(e.target.value);
          onGenerate({ datePreset, provider: e.target.value, team });
        }}
      >
        {PROVIDERS.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      {/* Team filter */}
      <select
        className={styles.select}
        value={team}
        onChange={(e) => {
          setTeam(e.target.value);
          onGenerate({ datePreset, provider, team: e.target.value });
        }}
      >
        {TEAMS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      {/* Generate button */}
      <button
        className={styles.generateBtn}
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className={styles.spinner} />
            Generating…
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Generate Report
          </>
        )}
      </button>
    </div>
  );
}
