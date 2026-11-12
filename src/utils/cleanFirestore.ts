/**
 * Strips all undefined fields, null prototypes, and unsupported types recursively
 * so Firestore setDoc / updateDoc operations never throw "Unsupported field value: undefined"
 */
export function cleanForFirestore<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;

  const cleaned: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      cleaned[key] = value.map((item) => {
        if (item && typeof item === 'object') {
          return cleanForFirestore(item);
        }
        return item === undefined ? null : item;
      });
    } else if (value && typeof value === 'object' && !(value instanceof Date)) {
      cleaned[key] = cleanForFirestore(value);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned as T;
}
