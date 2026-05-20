/** Metro inlines EXPO_PUBLIC_* at bundle time; TS needs `process` for typecheck. */
declare const process: {
  env: {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    EXPO_PUBLIC_APP_URL?: string;
    [key: string]: string | undefined;
  };
};
