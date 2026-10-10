import React, { useState } from 'react';
import { MapPin, Navigation, Check } from 'lucide-react';
import { GeoLocation, SAMPLE_LOCALITIES } from '../data/store';
import { Language, t } from '../i18n';

interface LocationSelectorProps {
  lang: Language;
  value?: GeoLocation;
  onChange: (loc: GeoLocation) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  lang,
  value,
  onChange,
}) => {
  const [detecting, setDetecting] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [customArea, setCustomArea] = useState('');

  const handleUseGps = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError(t('locationPermissionDenied', lang));
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetecting(false);
        onChange({
          lat: Math.round(pos.coords.latitude * 10000) / 10000,
          lng: Math.round(pos.coords.longitude * 10000) / 10000,
          areaNameEn: 'Current GPS Location',
          areaNameHi: 'वर्तमान जीपीएस स्थान',
        });
      },
      () => {
        setDetecting(false);
        setGeoError(t('locationPermissionDenied', lang));
      },
      { enableHighAccuracy: false, timeout: 7000 }
    );
  };

  const handleSetCustomArea = () => {
    const trimmed = customArea.trim();
    if (!trimmed) return;
    // Use default central coordinates when typing a custom area name
    const base = SAMPLE_LOCALITIES[0];
    onChange({
      lat: base.lat,
      lng: base.lng,
      areaNameEn: trimmed,
      areaNameHi: trimmed,
    });
    setCustomArea('');
  };

  return (
    <div className="space-y-4">
      {/* Current Selected Location Display */}
      {value && (
        <div className="p-3.5 rounded-[16px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                {lang === 'hi' ? value.areaNameHi : value.areaNameEn}
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400 tabular-nums">
                {value.lat.toFixed(4)}° N, {value.lng.toFixed(4)}° E
              </div>
            </div>
          </div>
          <Check className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" aria-hidden="true" />
        </div>
      )}

      {/* GPS Button */}
      <button
        type="button"
        onClick={handleUseGps}
        disabled={detecting}
        className="w-full min-h-[56px] px-4 py-3 rounded-[16px] border-2 border-[#FB8B11] bg-[#FEB21D]/10 hover:bg-[#FEB21D]/20 text-[#16213A] dark:text-white font-bold text-base flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
      >
        <Navigation className="w-5 h-5 text-[#EA580C] dark:text-[#FEB21D]" aria-hidden="true" />
        <span>
          {detecting ? t('detectingLocation', lang) : t('useCurrentLocation', lang)}
        </span>
      </button>

      {geoError && (
        <p className="text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-[14px] p-3">
          {geoError}
        </p>
      )}

      {/* Sample Localities Grid */}
      <div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">
          {t('orPickSampleLocality', lang)}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SAMPLE_LOCALITIES.map((loc) => {
            const isSelected =
              value?.areaNameEn === loc.areaNameEn && value?.lat === loc.lat;
            return (
              <button
                key={loc.areaNameEn}
                type="button"
                onClick={() => onChange(loc)}
                className={`min-h-[52px] px-3.5 py-2.5 rounded-[14px] border text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A] dark:border-[#FEB21D]'
                    : 'bg-slate-50 dark:bg-[#0E1527] text-[#16213A] dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-[#FB8B11]'
                }`}
              >
                <span className="text-sm font-semibold truncate">
                  {lang === 'hi' ? loc.areaNameHi : loc.areaNameEn}
                </span>
                {isSelected && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Area Name Input */}
      <div>
        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
          {t('orTypeAreaName', lang)}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customArea}
            onChange={(e) => setCustomArea(e.target.value)}
            placeholder={t('areaNamePlaceholder', lang)}
            className="flex-1 min-h-[52px] px-4 rounded-[14px] bg-slate-50 dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-base text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
          />
          <button
            type="button"
            onClick={handleSetCustomArea}
            disabled={!customArea.trim()}
            className="min-h-[52px] px-4 rounded-[14px] bg-[#16213A] dark:bg-slate-800 text-white font-bold text-sm whitespace-nowrap shrink-0 disabled:opacity-40 cursor-pointer"
          >
            {t('useTypedAreaBtn', lang)}
          </button>
        </div>
      </div>
    </div>
  );
};
