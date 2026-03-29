/**
 * TanStack Query hooks for all app data.
 *
 * Static data uses `staleTime: Infinity` – it's bundled in the app,
 * so there's nothing to refetch.
 * User-specific data (current week) depends on the user's conception date.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

const STATIC = { staleTime: Infinity } as const;

// ---- Weeks ----
export function useCurrentWeek(conceptionDate: string | undefined) {
  return useQuery({
    queryKey: ['currentWeek', conceptionDate],
    queryFn: () => api.getCurrentWeek(conceptionDate!),
    enabled: !!conceptionDate,
  });
}

export function useWeekDetail(weekNumber: number) {
  return useQuery({
    queryKey: ['week', weekNumber],
    queryFn: () => api.getWeek(weekNumber),
    ...STATIC,
  });
}

export function useAllWeeks(conceptionDate: string | undefined) {
  return useQuery({
    queryKey: ['allWeeks', conceptionDate],
    queryFn: () => api.getAllWeeks(conceptionDate!),
    enabled: !!conceptionDate,
  });
}

// ---- Checkups ----
export function useCheckupVisits() {
  return useQuery({ queryKey: ['checkupVisits'], queryFn: () => api.getCheckupVisits(), ...STATIC });
}

// ---- Shopping / Planning ----
export function useShopping() {
  return useQuery({ queryKey: ['shopping'], queryFn: () => api.getShopping(), ...STATIC });
}

export function useCalculator() {
  return useQuery({ queryKey: ['calculator'], queryFn: () => api.getCalculator(), ...STATIC });
}

// ---- Birth ----
export function useBirthPreparation() {
  return useQuery({ queryKey: ['birthPrep'], queryFn: () => api.getBirthPreparation(), ...STATIC });
}

export function useBagChecklist() {
  return useQuery({ queryKey: ['bagChecklist'], queryFn: () => api.getBagChecklist(), ...STATIC });
}

// ---- Fourth trimester ----
export function useFourthTrimester() {
  return useQuery({ queryKey: ['fourthTrimester'], queryFn: () => api.getFourthTrimester(), ...STATIC });
}

// ---- Action cards ----
export function useActionCardsDeck() {
  return useQuery({ queryKey: ['actionCards'], queryFn: () => api.getActionCardsDeck(), ...STATIC });
}

// ---- Dad module ----
export function useDadModule() {
  return useQuery({ queryKey: ['dadModule'], queryFn: () => api.getDadModule(), ...STATIC });
}
