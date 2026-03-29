import React from 'react';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

// Maps semantic icon names to Material Icons
// Using Material Symbols Rounded equivalents from @expo/vector-icons
type IconSet = 'mi' | 'mci';

interface IconDef {
  set: IconSet;
  name: string;
}

const ICON_MAP: Record<string, IconDef> = {
  // Navigation / Tabs
  'home': { set: 'mi', name: 'home' },
  'bolt': { set: 'mi', name: 'bolt' },
  'calendar': { set: 'mi', name: 'event' },
  'money': { set: 'mi', name: 'savings' },
  'menu-book': { set: 'mi', name: 'menu-book' },

  // Module icons
  'fetus': { set: 'mci', name: 'dna' },
  'partner': { set: 'mi', name: 'psychology' },
  'action-cards': { set: 'mi', name: 'bolt' },
  'checkups': { set: 'mi', name: 'event-note' },
  'planning': { set: 'mi', name: 'savings' },
  'hospital': { set: 'mi', name: 'local-hospital' },
  'dad': { set: 'mi', name: 'face-6' },
  'baby': { set: 'mi', name: 'child-care' },
  'baby-bottle': { set: 'mci', name: 'baby-bottle' },
  'notifications': { set: 'mi', name: 'notifications' },

  // Content icons - WeekDetail
  'ruler': { set: 'mi', name: 'straighten' },
  'brain': { set: 'mi', name: 'psychology' },
  'lightbulb': { set: 'mi', name: 'lightbulb' },
  'check-circle': { set: 'mi', name: 'check-circle' },
  'arrow-forward': { set: 'mi', name: 'arrow-forward' },

  // Planning
  'shopping-cart': { set: 'mi', name: 'shopping-cart' },
  'calculate': { set: 'mi', name: 'calculate' },
  'diamond': { set: 'mi', name: 'diamond' },
  'date-range': { set: 'mi', name: 'date-range' },

  // Birth prep
  'checklist': { set: 'mi', name: 'assignment' },
  'timer': { set: 'mi', name: 'timer' },
  'warning': { set: 'mi', name: 'warning' },
  'luggage': { set: 'mi', name: 'luggage' },
  'partner-role': { set: 'mi', name: 'face-6' },

  // Checkups
  'search': { set: 'mi', name: 'search' },
  'help': { set: 'mi', name: 'help-outline' },

  // Dad module
  'science': { set: 'mi', name: 'science' },
  'trending-down': { set: 'mi', name: 'trending-down' },
  'trending-up': { set: 'mi', name: 'trending-up' },
  'bedtime': { set: 'mi', name: 'bedtime' },
  'emergency': { set: 'mi', name: 'emergency' },

  // Fourth trimester
  'couple': { set: 'mi', name: 'favorite' },

  // Action card icons
  'sick': { set: 'mi', name: 'sick' },
  'chat': { set: 'mi', name: 'chat-bubble-outline' },
  'sad': { set: 'mi', name: 'sentiment-dissatisfied' },
  'anxious': { set: 'mci', name: 'emoticon-confused-outline' },
  'sleep': { set: 'mci', name: 'sleep' },
  'do-not-touch': { set: 'mci', name: 'hand-back-left-off' },

  // Misc
  'wave': { set: 'mi', name: 'waving-hand' },
  'gear': { set: 'mi', name: 'settings' },
  'expand-less': { set: 'mi', name: 'expand-less' },
  'expand-more': { set: 'mi', name: 'expand-more' },
  'checkbox-blank': { set: 'mi', name: 'check-box-outline-blank' },
  'radio-blank': { set: 'mi', name: 'radio-button-unchecked' },
  'dot': { set: 'mi', name: 'fiber-manual-record' },
  'tip': { set: 'mi', name: 'tips-and-updates' },
  'progress': { set: 'mi', name: 'show-chart' },
  'info': { set: 'mi', name: 'info-outline' },
  'mom': { set: 'mi', name: 'face-3' },
  'shirt': { set: 'mci', name: 'tshirt-crew' },
  'hygiene': { set: 'mci', name: 'hand-wash' },
  'car': { set: 'mi', name: 'directions-car' },
  'post-birth': { set: 'mi', name: 'description' },
  'happy': { set: 'mi', name: 'sentiment-satisfied' },
};

interface IconProps {
  name: keyof typeof ICON_MAP | string;
  size?: number;
  color?: string;
  style?: any;
}

export default function Icon({ name, size = 24, color = '#FFFFFF' }: IconProps) {
  const def = ICON_MAP[name];
  if (!def) {
    // Fallback: try as direct MaterialIcons name
    return <MaterialIcons name={name as any} size={size} color={color} />;
  }
  if (def.set === 'mci') {
    return <MaterialCommunityIcons name={def.name as any} size={size} color={color} />;
  }
  return <MaterialIcons name={def.name as any} size={size} color={color} />;
}

export { ICON_MAP };
