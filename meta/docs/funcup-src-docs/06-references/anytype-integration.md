# AnyType Integration

## Wymagania

- AnyType Plus (dla funkcji API)
- Aplikacja AnyType uruchomiona lokalnie
- API key wygenerowany w AnyType → Settings → API Keys

## Lokalne API

AnyType MCP łączy się do lokalnego API:
- Domyślnie: `http://127.0.0.1:31009`

## Konfiguracja projektu

### 1. Skrypt MCP

Utworzono `product/scripts/anytype-mcp.sh` - wrapper z odpowiednimi zmiennymi środowiskowymi.

### 2. Konfiguracja OpenCode

```json
{
  "mcp": {
    "anytype": {
      "type": "local",
      "command": ["bash", "./product/scripts/anytype-mcp.sh"],
      "enabled": true
    }
  }
}
```

## Testowanie

```bash
# Sprawdź połączenie
opencode mcp list

# Powinno pokazać:
# ●  ✓ anytype connected
```

## API Test

```bash
# Bezpośredni test API
curl -H "Authorization: Bearer TWOJ_TOKEN" \
     -H "Anytype-Version: 2025-11-08" \
     http://127.0.0.1:31009/v1/spaces
```

## Rozwiązywanie problemów

| Problem | Rozwiązanie |
|---------|-------------|
| 401 z MCP | Sprawdź czy skrypt ma poprawne zmienne środowiskowe |
| Connection refused | Upewnij się, że AnyType jest uruchomione (port 31009) |
| Brak narzędzi | Uruchom ponownie sesję opencode |