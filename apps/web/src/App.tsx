import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DECK,
  canConfirm,
  getCardById,
  revealCards,
  toggleSelection,
  type RevealedCard,
} from '@fasttarot/core';
import CardWheel from './components/CardWheel';
import EnterButton from './components/EnterButton';
import LanguageSwitcher from './components/LanguageSwitcher';
import RevealPage from './components/RevealPage';
import Toast from './components/Toast';
import { wheelMetrics } from './wheelGeometry';

type Screen = 'pick' | 'reveal';

const TOAST_MS = 2600;

export default function App() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>('pick');
  const [selected, setSelected] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<RevealedCard[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Measure the picker body (width AND height) so we can split it into two
  // non-overlapping parts: the wheel gets its room first, the instruction +
  // button use whatever is left above it.
  const bodyRef = useRef<HTMLDivElement>(null);
  const [body, setBody] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBody({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  const handleSelect = useCallback(
    (cardId: string) => {
      setSelected((prev) => {
        const { selection, rejected } = toggleSelection(prev, cardId);
        if (rejected) showToast(t('toast.maxCards'));
        return selection;
      });
    },
    [showToast, t],
  );

  const handleEnter = useCallback(() => {
    // Resolve ids -> cards in pick order, then assign random orientations once.
    const picked = selected.map((id) => getCardById(id)).filter(Boolean) as typeof DECK;
    setRevealed(revealCards(picked));
    setScreen('reveal');
  }, [selected]);

  const handleBack = useCallback(() => {
    setSelected([]);
    setRevealed([]);
    setScreen('pick');
  }, []);

  if (screen === 'reveal') {
    return <RevealPage cards={revealed} onBack={handleBack} />;
  }

  // Two-part split, wheel first: the wheel takes its natural fan height (capped
  // so a minimum always remains for the text above), and the instruction +
  // button fill whatever height is left. The two regions never overlap.
  const fanHeight = wheelMetrics(body.w, 0).fanHeight;
  const MIN_UPPER = 96; // guaranteed room for instruction + button
  const wheelHeight =
    body.h > 0 ? Math.min(fanHeight, Math.max(0, body.h - MIN_UPPER)) : fanHeight;

  return (
    <div className="starfield relative z-10 flex h-full flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between px-5 py-4">
        <span className="font-display text-xl font-bold tracking-wide text-gold">
          {t('app.title')}
        </span>
        <LanguageSwitcher />
      </header>

      <div ref={bodyRef} className="flex min-h-0 flex-1 flex-col">
        {/* Upper part: instruction + Enter button. Fills the space left over
            after the wheel below has claimed its room; centered within it. */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="max-w-md font-serif text-lg text-white/90 sm:text-xl">
            {t('picker.instruction')}
          </p>
          <div className="h-12">
            <EnterButton visible={canConfirm(selected)} onEnter={handleEnter} />
          </div>
        </div>

        {/* Lower part: the card wheel, given its room first. Only the upper arc
            shows; the band clips the rest so nothing spills into the text. */}
        <div className="relative w-full shrink-0 overflow-hidden" style={{ height: wheelHeight }}>
          <CardWheel selected={selected} onSelect={handleSelect} />
        </div>
      </div>

      <Toast message={toast} />
    </div>
  );
}
