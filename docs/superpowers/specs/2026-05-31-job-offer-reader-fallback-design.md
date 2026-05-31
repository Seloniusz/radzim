# Job Offer Reader Fallback Design

## Problem

Niektóre publiczne serwisy ogłoszeniowe, w tym Pracuj.pl, zwracają `403 Forbidden`
dla requestów wykonywanych przez funkcję Vercela. Przeglądarka użytkownika może
otworzyć ten sam URL, ale backend nie otrzymuje treści potrzebnej do analizy.

## Decision

Backend zachowuje bezpośrednie pobieranie oferty jako podstawową ścieżkę. Jeżeli
źródłowa strona zwróci `403`, backend ponawia odczyt publicznego URL-a przez Jina
Reader API pod adresem `https://r.jina.ai/<publiczny-url>`.

Reader API otrzymuje wyłącznie URL publicznego ogłoszenia. CV, jego fragmenty ani
wynik analizy nie są przekazywane do Jina AI.

## Boundaries

- Akceptowane są tylko adresy `http:` i `https:`.
- Odrzucane są adresy lokalne oraz prywatne adresy IP.
- Fallback Reader uruchamia się wyłącznie po odpowiedzi `403`.
- Treść oferty jest normalizowana i ograniczana do `8000` znaków jak dotychczas.
- Dla błędów innych niż `403` użytkownik nadal otrzymuje czytelny komunikat.

## Structure

- `api/job-offer.js` odpowiada za walidację URL-a, pobranie bezpośrednie,
  fallback Reader oraz normalizację tekstu.
- `api/analyze.js` korzysta z modułu zamiast implementować scraping wewnątrz
  handlera.
- `polityka-prywatnosci.html` informuje, że publiczny URL oferty może zostać
  przekazany do Jina AI w celu odczytu strony.

## Verification

- Testy jednostkowe symulują bezpośrednie `200`, fallback po `403`, brak
  fallbacku dla innych błędów oraz blokadę prywatnego URL-a.
- Produkcyjny smoke test analizuje CV z podanym linkiem Pracuj.pl.

