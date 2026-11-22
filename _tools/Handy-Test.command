#!/bin/bash
# Startet die Atelier-App für den Test auf dem Handy (gleiches WLAN nötig).
# Doppelklick genügt. Beenden mit Ctrl+C oder Fenster schließen.
cd "$(dirname "$0")/.." || exit 1
PORT=8765
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
HOST=$(scutil --get LocalHostName 2>/dev/null)
clear
echo "=============================================="
echo "  Atelier for Food – Handy-Test"
echo "=============================================="
echo
echo "  Handy und Mac müssen im selben WLAN sein."
echo "  Öffne auf dem Handy in Safari:"
echo
[ -n "$IP" ]   && echo "      http://$IP:$PORT"
[ -n "$HOST" ] && echo "      http://$HOST.local:$PORT   (bleibt in jedem WLAN gleich)"
[ -z "$IP" ] && echo "      Keine WLAN-Adresse gefunden. Mit dem WLAN verbunden?"
echo
echo "  Beenden: Ctrl+C"
echo "----------------------------------------------"
exec python3 -m http.server $PORT
