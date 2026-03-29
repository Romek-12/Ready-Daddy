export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Onboarding: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string };
};

export type HomeStackParamList = {
  HomeMain: undefined;
  Settings: undefined;
  WeekDetail: { week?: number };
  BirthPrep: undefined;
  DadModule: undefined;
  FourthTrimester: undefined;
  PostBirth: undefined;
  Checkups: undefined;
  Planning: undefined;
  DadPolog: undefined;
  DadRelacja: undefined;
  DadNoworodek: undefined;
};

export type DadStackParamList = {
  DadModuleMain: undefined;
  DadPolog: undefined;
  DadRelacja: undefined;
  DadNoworodek: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  WeekDetailTab: { week?: number };
  ActionCards: { initialCardId?: string };
  DadModuleTab: undefined;
};

/** Shared minimal navigation prop — use for screens navigating across multiple stacks/tabs */
export type AppNavigation = {
  navigate: (screen: string, params?: object) => void;
  goBack: () => void;
};
