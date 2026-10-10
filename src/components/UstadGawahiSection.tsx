import React, { useState, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  MessageCircle,
  Plus,
  Trash2,
  Edit3,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import {
  Reference,
  WorkerProfile,
  addReference,
  deleteReference,
  listReferences,
  maskRefereeMobile,
  updateReference,
} from '../data/store';
import {
  Language,
  REFEREE_RELATIONS,
  RefereeRelation,
  getRefereeRelationLabel,
  getTradeLabel,
  t,
} from '../i18n';

interface UstadGawahiSectionProps {
  worker: WorkerProfile;
  lang: Language;
  canEdit?: boolean;
  onRefresh: () => void;
}

export const UstadGawahiSection: React.FC<UstadGawahiSectionProps> = ({
  worker,
  lang,
  canEdit = false,
  onRefresh,
}) => {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState<RefereeRelation>('ustad');
  const [mobile, setMobile] = useState('');
  const [line, setLine] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const references = useMemo(() => listReferences(worker.id), [worker]);

  const workerDisplayName = lang === 'hi' ? worker.nameHi : worker.nameEn;
  const tradeDisplay = getTradeLabel(worker.trade, lang, worker.customTradeName);

  const resetForm = () => {
    setName('');
    setRelation('ustad');
    setMobile('');
    setLine('');
    setEditingId(null);
    setErrorMsg(null);
  };

  const handleStartEdit = (ref: Reference) => {
    setEditingId(ref.id);
    setName(ref.name);
    setRelation(ref.relation);
    setMobile(ref.mobile);
    setLine(ref.line);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg(t('errRefereeNameRequired', lang));
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setErrorMsg(t('errRefereeMobileInvalid', lang));
      return;
    }

    if (!line.trim()) {
      setErrorMsg(t('errRefereeLineRequired', lang));
      return;
    }

    if (editingId) {
      updateReference(editingId, {
        name: name.trim(),
        relation,
        mobile: cleanMobile,
        line: line.trim().slice(0, 120),
      });
      resetForm();
      onRefresh();
      return;
    }

    if (references.length >= 3) {
      setErrorMsg(t('errMaxReferences', lang));
      return;
    }

    const res = addReference({
      workerId: worker.id,
      name: name.trim(),
      relation,
      mobile: cleanMobile,
      line: line.trim().slice(0, 120),
    });

    if (res.error === 'max_limit') {
      setErrorMsg(t('errMaxReferences', lang));
      return;
    }
    if (res.error === 'invalid_mobile') {
      setErrorMsg(t('errRefereeMobileInvalid', lang));
      return;
    }
    if (res.error === 'storage_full') {
      setErrorMsg(t('storageFullError', lang));
      return;
    }

    resetForm();
    onRefresh();
  };

  const handleMarkConfirmedDemo = (refId: string) => {
    updateReference(refId, { status: 'confirmed_demo' });
    onRefresh();
  };

  const handleDelete = (refId: string) => {
    deleteReference(refId);
    if (editingId === refId) {
      resetForm();
    }
    onRefresh();
  };

  const buildWhatsAppLink = (ref: Reference): string => {
    const cleanPhone = ref.mobile.replace(/\D/g, '');
    const msg =
      lang === 'hi'
        ? `नमस्ते ${ref.name} जी, मैं ${workerDisplayName} (${tradeDisplay}, Shramik ID: ${worker.shramikId}) हूँ। मैंने श्रमिक (Shramik) ऐप पर आपको अपनी "उस्ताद की गवाही" में जोड़ा है: "${ref.line}"। कृपया मेरे काम की पुष्टि करें। धन्यवाद!`
        : `Namaste ${ref.name}, I am ${workerDisplayName} (${tradeDisplay}, Shramik ID: ${worker.shramikId}). I have added you as a reference ("Ustad Ki Gawahi") on the Shramik app: "${ref.line}". Please confirm my work record. Thank you!`;
    return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <section className="bg-white dark:bg-[#17213A] rounded-[20px] p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-[#FB8B11] shrink-0" aria-hidden="true" />
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#16213A] dark:text-white">
              {t('gawahiSectionTitle', lang)} ({references.length}/3)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            {t('gawahiSectionSub', lang)}
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-[#FEB21D] text-xs font-extrabold self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5" />
          <span>{t('chipSelfReported', lang)}</span>
        </span>
      </div>

      {/* Mandatory OTP Demo Note */}
      <div className="p-3.5 rounded-[14px] bg-amber-50/80 dark:bg-[#0E1527] border border-[#FEB21D]/60 flex items-start gap-2.5 text-xs font-bold text-[#16213A] dark:text-[#FEB21D]">
        <ShieldAlert className="w-4 h-4 text-[#FB8B11] shrink-0 mt-0.5" aria-hidden="true" />
        <span>{t('gawahiOtpNote', lang)}</span>
      </div>

      {/* Reference Cards List */}
      {references.length === 0 ? (
        <div className="p-6 rounded-[16px] bg-[#F3F5F9] dark:bg-[#0E1527] text-center border border-slate-200/70 dark:border-slate-800">
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            {t('noReferencesYet', lang)}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {references.map((ref) => {
            const isConfirmedDemo = ref.status === 'confirmed_demo';
            return (
              <article
                key={ref.id}
                className="p-4 rounded-[18px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-200/80 dark:border-slate-800 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-extrabold text-[#16213A] dark:text-white">
                        {ref.name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#16213A] text-[#FEB21D] text-xs font-bold">
                        {getRefereeRelationLabel(ref.relation, lang)}
                      </span>
                      {ref.isSample && (
                        <span className="px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900/60 text-[#16213A] dark:text-[#FEB21D] text-[10px] font-extrabold">
                          {t('sampleDataTag', lang)}
                        </span>
                      )}
                    </div>

                    {/* Masked Mobile Number: NEVER show full mobile number, only last 2 digits (XXXXXXXX45) */}
                    <p className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 mt-1">
                      📞 {maskRefereeMobile(ref.mobile)}
                    </p>
                  </div>

                  {/* Status Chip: Unconfirmed vs Confirmed (DEMO) */}
                  <div>
                    {isConfirmedDemo ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 text-xs font-extrabold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t('refStatusConfirmedDemo', lang)}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-extrabold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{t('refStatusUnconfirmed', lang)}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* One short line (max 120 chars) */}
                <p className="text-sm font-medium text-[#16213A] dark:text-slate-200 italic bg-white dark:bg-[#17213A] p-3 rounded-[12px] border border-slate-200/60 dark:border-slate-800">
                  “{ref.line}”
                </p>

                {/* Worker Actions: Send WhatsApp Request + Mark as Confirmed (DEMO) + Edit/Delete */}
                {canEdit && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* WhatsApp Request Link (status stays Unconfirmed) */}
                      <a
                        href={buildWhatsAppLink(ref)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] px-3.5 py-2 rounded-[12px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <MessageCircle className="w-4 h-4 shrink-0" />
                        <span>{t('sendWhatsappRequestBtn', lang)}</span>
                      </a>

                      {/* TEST MODE button: Mark as confirmed (demo) */}
                      {!isConfirmedDemo && (
                        <button
                          type="button"
                          onClick={() => handleMarkConfirmedDemo(ref.id)}
                          className="min-h-[44px] px-3.5 py-2 rounded-[12px] bg-amber-100 dark:bg-amber-950/70 border border-[#FB8B11] text-[#16213A] dark:text-[#FEB21D] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer hover:bg-amber-200/70"
                        >
                          <span className="px-1.5 py-0.5 rounded bg-[#EA580C] text-white text-[10px] font-mono">
                            DEMO
                          </span>
                          <span>{t('markConfirmedDemoBtn', lang)}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(ref)}
                        className="min-h-[40px] px-3 py-1.5 rounded-[10px] bg-white dark:bg-[#17213A] border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#16213A] dark:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#FB8B11]" />
                        <span>{t('editBtn', lang)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(ref.id)}
                        className="min-h-[40px] px-3 py-1.5 rounded-[10px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-700 dark:text-red-300 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t('deleteBtn', lang)}</span>
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Add / Edit Reference Form (Worker Only, up to 3 references) */}
      {canEdit && (references.length < 3 || editingId) && (
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-5 rounded-[18px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-200 dark:border-slate-800 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#16213A] dark:text-white mb-1.5">
                {t('refereeNameLabel', lang)} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('refereeNamePlaceholder', lang)}
                className="w-full min-h-[52px] px-3.5 rounded-[14px] bg-white dark:bg-[#17213A] border border-slate-300 dark:border-slate-700 text-sm font-bold text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16213A] dark:text-white mb-1.5">
                {t('refereeMobileLabel', lang)} *
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder={t('refereeMobilePlaceholder', lang)}
                className="w-full min-h-[52px] px-3.5 rounded-[14px] bg-white dark:bg-[#17213A] border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
              />
            </div>
          </div>

          {/* Relation Selector (Contractor, Ustad, Customer, Shop owner) */}
          <div>
            <label className="block text-xs font-bold text-[#16213A] dark:text-white mb-1.5">
              {t('refereeRelationLabel', lang)} *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {REFEREE_RELATIONS.map((rel) => {
                const active = relation === rel;
                return (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => setRelation(rel)}
                    className={`min-h-[48px] px-3 py-2 rounded-[12px] border text-xs font-extrabold transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A] dark:border-[#FEB21D]'
                        : 'bg-white dark:bg-[#17213A] text-[#16213A] dark:text-slate-200 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {getRefereeRelationLabel(rel, lang)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Short Line (max 120 chars) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#16213A] dark:text-white">
                {t('refereeLineLabel', lang)} *
              </label>
              <span className="text-xs font-mono font-bold text-slate-500">
                {line.length}/120
              </span>
            </div>
            <input
              type="text"
              maxLength={120}
              value={line}
              onChange={(e) => setLine(e.target.value.slice(0, 120))}
              placeholder={t('refereeLinePlaceholder', lang)}
              className="w-full min-h-[52px] px-3.5 rounded-[14px] bg-white dark:bg-[#17213A] border border-slate-300 dark:border-slate-700 text-sm text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-[12px] bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="submit"
              className="min-h-[54px] px-5 py-2.5 rounded-[16px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display text-base font-extrabold inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>
                {editingId ? t('saveReferenceBtn', lang) : t('addReferenceBtn', lang)}
              </span>
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="min-h-[54px] px-4 py-2.5 rounded-[16px] border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                {t('cancelEditBtn', lang)}
              </button>
            )}
          </div>
        </form>
      )}

      {canEdit && references.length >= 3 && !editingId && (
        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
          ✓ {t('maxReferencesReached', lang)}
        </p>
      )}
    </section>
  );
};
