
(function () {
  if (!window.supabase || !window.HERTS_SUPABASE_URL ||
      !window.HERTS_SUPABASE_PUBLISHABLE_KEY) {
    console.error("HERTS: Supabase library atau konfigurasi belum tersedia.");
    return;
  }

  window.HERTS_SUPABASE = window.supabase.createClient(
    window.HERTS_SUPABASE_URL,
    window.HERTS_SUPABASE_PUBLISHABLE_KEY
  );

  console.log("HERTS: Supabase client berhasil dibuat.");
})();
