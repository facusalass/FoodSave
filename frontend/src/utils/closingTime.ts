const CLOSING_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function normalizeClosingTime(value?: string | null) {
  if (!value) {
    return null;
  }

  const cleanValue = value.trim().toLowerCase().replace(/\s*hs\.?$/, "");

  if (!CLOSING_TIME_PATTERN.test(cleanValue)) {
    return null;
  }

  return cleanValue;
}

export function formatClosingTimeDisplay(value?: string | null, fallback = "--") {
  const normalizedTime = normalizeClosingTime(value);

  return normalizedTime ? `${normalizedTime} hs` : fallback;
}

export function maskClosingTimeInput(value: string, previousValue: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length >= 1 && Number(digits[0]) > 2) {
    return previousValue;
  }

  if (digits.length >= 2 && Number(digits.slice(0, 2)) > 23) {
    return previousValue;
  }

  if (digits.length >= 3 && Number(digits[2]) > 5) {
    return previousValue;
  }

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function isValidClosingTime(value: string) {
  return normalizeClosingTime(value) !== null;
}
