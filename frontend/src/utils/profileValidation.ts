export type ClientProfileValidationErrors = {
  name?: string;
  phone?: string;
  city?: string;
  address?: string;
};

type ClientProfileValues = {
  name?: string;
  phone?: string;
  city?: string;
  address?: string;
};

type ClientProfileValidationOptions = {
  requireCity?: boolean;
  requireAddress?: boolean;
};

const CITY_PATTERN = /^[\p{L}\s.,-]+$/u;
const PHONE_PATTERN = /^[+()\d\s-]+$/;

export function validateClientProfile(
  values: ClientProfileValues,
  options: ClientProfileValidationOptions = {}
) {
  const errors: ClientProfileValidationErrors = {};
  const name = values.name?.trim() ?? "";
  const phone = values.phone?.trim() ?? "";
  const city = values.city?.trim() ?? "";
  const address = values.address?.trim() ?? "";

  if (!name) {
    errors.name = "Ingresa tu nombre y apellido.";
  } else if (name.length < 2) {
    errors.name = "El nombre debe tener al menos 2 caracteres.";
  } else if (!hasLetter(name) || /^\d+$/.test(name)) {
    errors.name = "El nombre no puede ser solo numeros.";
  }

  if (phone) {
    const digitCount = phone.replace(/\D/g, "").length;

    if (!PHONE_PATTERN.test(phone) || digitCount < 8) {
      errors.phone = "Ingresa un telefono valido con al menos 8 numeros.";
    }
  }

  const cityError = validateCity(city, options.requireCity ?? false);
  if (cityError) {
    errors.city = cityError;
  }

  const addressError = validateAddress(
    address,
    options.requireAddress ?? false
  );
  if (addressError) {
    errors.address = addressError;
  }

  return errors;
}

export function hasValidReservationProfile(values: {
  city?: string;
  address?: string;
}) {
  const errors = validateClientProfile(
    {
      address: values.address,
      city: values.city,
      name: "Usuario"
    },
    { requireAddress: true, requireCity: true }
  );

  return !errors.city && !errors.address;
}

function validateCity(value: string, isRequired: boolean) {
  if (!value) {
    return isRequired ? "Ingresa tu ciudad." : undefined;
  }

  if (value.length < 2) {
    return "La ciudad debe tener al menos 2 caracteres.";
  }

  if (!CITY_PATTERN.test(value) || !hasLetter(value)) {
    return "Ingresa una ciudad valida, por ejemplo Resistencia, Chaco.";
  }

  return undefined;
}

function validateAddress(value: string, isRequired: boolean) {
  if (!value) {
    return isRequired ? "Ingresa tu direccion." : undefined;
  }

  if (value.length < 5) {
    return "La direccion debe tener al menos 5 caracteres.";
  }

  if (!hasLetter(value)) {
    return "La direccion debe incluir el nombre de la calle.";
  }

  return undefined;
}

function hasLetter(value: string) {
  return /\p{L}/u.test(value);
}
