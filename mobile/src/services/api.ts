/**
 * Data service – static data from bundled JSON, user data from Supabase.
 */
import { supabase } from '../lib/supabase';

// Bundled static data (shipped with the app – no network needed)
import weeksData from '../data/weeks.json';
import actionCardsData from '../data/action-cards.json';
import checkupsData from '../data/checkups.json';
import checkupVisitsData from '../data/checkup-visits.json';
import shoppingItemsData from '../data/shopping-items.json';
import birthPrepData from '../data/birth-preparation.json';
import bagChecklistData from '../data/bag-checklist.json';
import fourthTrimesterData from '../data/fourth-trimester.json';
import dadModuleData from '../data/dad-module.json';

// ---------------------------------------------------------------------------
// Helper: calculate current pregnancy week from conception date
// ---------------------------------------------------------------------------
function getCurrentWeek(conceptionDate: string): number {
  const conception = new Date(conceptionDate);
  const now = new Date();
  const diffMs = now.getTime() - conception.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.min(Math.max(diffWeeks + 2, 1), 42);
}

// ---------------------------------------------------------------------------
// Public API – drop-in replacement for the old REST client
// ---------------------------------------------------------------------------
export const api = {
  // ---- User profile (Supabase) ----
  updateProfile: async (userId: string, data: { conceptionDate?: string; partnerName?: string }) => {
    const updates: Record<string, string> = {};
    if (data.conceptionDate !== undefined) updates.conception_date = data.conceptionDate;
    if (data.partnerName !== undefined) updates.partner_name = data.partnerName;
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw new Error(error.message);
  },

  forgotPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
  },

  // ---- Weeks (local computation + bundled data) ----
  getCurrentWeek: (conceptionDate: string) => {
    const currentWeek = getCurrentWeek(conceptionDate);
    const weekData = (weeksData as any[]).find(w => w.week_number === currentWeek) || null;
    const cards = (actionCardsData as any[]).filter(
      c => c.week_min <= currentWeek && c.week_max >= currentWeek
    );
    const totalWeeks = 42;
    const progress = Math.round((currentWeek / totalWeeks) * 100);
    const trimester = weekData
      ? weekData.trimester
      : currentWeek <= 13 ? 1 : currentWeek <= 27 ? 2 : 3;

    return { currentWeek, totalWeeks, progress, trimester, weekData, actionCards: cards };
  },

  getWeek: (weekNumber: number) => {
    const week = (weeksData as any[]).find(w => w.week_number === weekNumber) || null;
    const cards = (actionCardsData as any[]).filter(
      c => c.week_min <= weekNumber && c.week_max >= weekNumber
    );
    const checks = (checkupsData as any[]).filter(c => c.week_number === weekNumber);
    return { week, actionCards: cards, checkups: checks };
  },

  getAllWeeks: (conceptionDate: string) => {
    const currentWeek = getCurrentWeek(conceptionDate);
    const weeks = (weeksData as any[]).map(w => ({
      week_number: w.week_number,
      trimester: w.trimester,
      fetus_size_comparison: w.fetus_size_comparison,
      unlocked: w.week_number <= currentWeek,
    }));
    return { currentWeek, weeks };
  },

  // ---- Checkups (bundled) ----
  getCheckups: () => ({ checkups: checkupsData }),
  getCheckupVisits: () => ({ visits: checkupVisitsData }),

  // ---- Shopping (bundled) ----
  getShopping: () => {
    const items = shoppingItemsData as any[];
    const grouped: Record<number, any[]> = { 1: [], 2: [], 3: [] };
    items.forEach(item => {
      if (grouped[item.trimester]) grouped[item.trimester].push(item);
    });
    const totalCost = items.reduce((sum, i) => sum + (i.estimated_cost_pln || 0), 0);
    return { items: grouped, totalCost };
  },

  getCalculator: () => {
    const items = shoppingItemsData as any[];
    const essentialItems = items.filter(i => i.is_essential);
    const essentialTotal = essentialItems.reduce((sum, i) => sum + (i.estimated_cost_pln || 0), 0);
    const fullTotal = items.reduce((sum, i) => sum + (i.estimated_cost_pln || 0), 0);
    const monthlyCosts = { pieluchy: 200, mleko_lub_jedzenie: 150, kosmetyki: 80, ubranka: 100, lekarz: 100 };
    const monthlyTotal = Object.values(monthlyCosts).reduce((a, b) => a + b, 0);
    return {
      oneTimeCosts: { essential: essentialTotal, full: fullTotal, savings: fullTotal - essentialTotal },
      monthlyCosts,
      monthlyTotal,
      firstYearEstimate: essentialTotal + monthlyTotal * 12,
    };
  },

  // ---- Birth (bundled) ----
  getBirthPreparation: () => ({ stages: birthPrepData }),
  getBagChecklist: () => ({ items: bagChecklistData }),

  // ---- Fourth trimester (bundled) ----
  getFourthTrimester: () => ({ weeks: fourthTrimesterData }),

  // ---- Action cards (bundled) ----
  getActionCardsDeck: () => ({ cards: actionCardsData }),

  // ---- Dad module (bundled) ----
  getDadModule: () => dadModuleData,
};
