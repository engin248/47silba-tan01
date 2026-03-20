# Raporlar

**Route:** `/raporlar`

## Klasör Yapısı

```
features/raporlar/
├── components/     # Bu modüle ait UI bileşenleri
├── hooks/          # Veri çekme ve logic hook'ları
├── services/       # Supabase API çağrıları
└── index.js        # Barrel file (dışa açık API)
```

## Kurallar

- Bileşen başına max **300 satır**
- Global CSS yok → **Tailwind** kullan
- Supabase çağrıları → `services/` altında
- State/logic → `hooks/` altında
- `page.js` → max **30 satır** (sadece giriş noktası)
