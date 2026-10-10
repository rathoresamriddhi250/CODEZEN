import React from 'react';
import {
  PaintRoller,
  Hammer,
  Scissors,
  Zap,
  Wrench,
  BrickWall,
  Cog,
} from 'lucide-react';
import { Language, TradeId } from '../i18n';
import { getTodayIso as storeGetTodayIso } from '../data/store';

interface TradeIconProps {
  trade: TradeId;
  className?: string;
}

export const TradeIcon: React.FC<TradeIconProps> = ({
  trade,
  className = 'w-5 h-5',
}) => {
  switch (trade) {
    case 'painter':
      return <PaintRoller className={className} aria-hidden="true" />;
    case 'carpenter':
      return <Hammer className={className} aria-hidden="true" />;
    case 'tailor':
      return <Scissors className={className} aria-hidden="true" />;
    case 'electrician':
      return <Zap className={className} aria-hidden="true" />;
    case 'plumber':
      return <Wrench className={className} aria-hidden="true" />;
    case 'mason':
      return <BrickWall className={className} aria-hidden="true" />;
    case 'other':
      return <Cog className={className} aria-hidden="true" />;
    default:
      return <Hammer className={className} aria-hidden="true" />;
  }
};

export function formatReadableDate(
  dateIso: string,
  lang: Language
): { shortDay: string; dayNum: string; monthName: string; fullLabel: string } {
  const todayIso = storeGetTodayIso();
  const [y, m, d] = dateIso.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);

  const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysHi = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];
  const monthsEn = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const monthsHi = [
    'जन', 'फ़र', 'मार्च', 'अप्रैल', 'मई', 'जून',
    'जुलाई', 'अग', 'सितं', 'अक्टू', 'नवं', 'दिसं',
  ];

  const dayOfWeek = dt.getDay();
  const dayNum = String(dt.getDate());
  const monthIdx = dt.getMonth();

  const shortDay = lang === 'hi' ? daysHi[dayOfWeek] : daysEn[dayOfWeek];
  const monthName = lang === 'hi' ? monthsHi[monthIdx] : monthsEn[monthIdx];

  if (dateIso === todayIso) {
    const todayWord = lang === 'hi' ? 'आज' : 'Today';
    return {
      shortDay: todayWord,
      dayNum,
      monthName,
      fullLabel: `${todayWord}, ${dayNum} ${monthName}`,
    };
  }

  return {
    shortDay,
    dayNum,
    monthName,
    fullLabel: `${shortDay}, ${dayNum} ${monthName}`,
  };
}
