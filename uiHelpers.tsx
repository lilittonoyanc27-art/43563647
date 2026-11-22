import React, { useState } from 'react';
import { Languages, Volume2, AlertTriangle, X } from 'lucide-react';

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatStudyTime(seconds: number): string {
  const totalMin = Math.floor(seconds / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min`;
  return `${Math.max(0, Math.floor(seconds))} s`;
}

export function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:«»"'\-—–()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function speakSpanish(text: string, rate = 0.95): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'es-AR';
    utter.rate = rate;
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang.toLowerCase().startsWith('es-ar')) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('es-419')) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('es'));
    if (preferred) utter.voice = preferred;
    window.speechSynthesis.speak(utter);
  } catch {
    // Graceful fallback if speech synthesis is blocked
  }
}

interface ClickableSpanishProps {
  es: string;
  hy: string;
  className?: string;
  hyClassName?: string;
  forceOpen?: boolean;
  defaultOpen?: boolean;
  showHintIcon?: boolean;
  withAudio?: boolean;
  asBlock?: boolean;
}

export const ClickableSpanish: React.FC<ClickableSpanishProps> = ({
  es,
  hy,
  className = 'text-base sm:text-lg font-medium text-[#2B1419]',
  hyClassName = 'text-sm sm:text-base text-[#800020] font-armenian mt-1.5 bg-[#FFF8E7] border border-[#FFD54F]/60 rounded-lg px-3 py-2',
  forceOpen,
  defaultOpen = false,
  showHintIcon = true,
  withAudio = false,
  asBlock = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const isVisible = forceOpen !== undefined ? forceOpen : open;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  return (
    <div className={asBlock ? 'w-full' : 'inline-block'}>
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={handleToggle}
          className={`text-left group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#800020] rounded transition-colors ${className}`}
          title={isVisible ? 'Ocultar traducción' : 'Mostrar traducción'}
        >
          <span className="group-hover:text-[#A51C30] transition-colors">{es}</span>
          {showHintIcon && (
            <span className="inline-flex items-center gap-1 ml-2 text-xs font-normal text-[#800020]/70 group-hover:text-[#800020] align-middle">
              <Languages className="w-3.5 h-3.5 inline" />
            </span>
          )}
        </button>
        {withAudio && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              speakSpanish(es);
            }}
            className="shrink-0 p-1.5 rounded-lg text-[#800020] hover:bg-[#800020]/10 transition-colors cursor-pointer"
            title="Escuchar pronunciación"
            aria-label="Escuchar pronunciación"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {isVisible && (
        <div className={`${hyClassName} animate-pop-success`}>{hy}</div>
      )}
    </div>
  );
};

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  descriptionHy: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  description,
  descriptionHy,
  confirmLabel,
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#EBD9C4] shadow-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E53935]/10 text-[#E53935] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#2B1419]">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-[#6E4A52] hover:bg-[#FFF8E7] cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="mt-4 text-sm text-[#2B1419] leading-relaxed">{description}</p>
        <p className="mt-2 text-sm text-[#6E4A52] font-armenian leading-relaxed">{descriptionHy}</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-[#EBD9C4] text-[#2B1419] hover:bg-[#FFF8E7] transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#E53935] text-white hover:bg-[#A51C30] transition-colors cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

interface CoverImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export const CoverImageWithFallback: React.FC<CoverImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackTitle,
}) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#800020] via-[#A51C30] to-[#FF9800] flex items-center justify-center p-6 text-center">
        <span className="font-display text-2xl font-bold text-[#FFF8E7]">{fallbackTitle || alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
