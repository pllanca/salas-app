import { z } from 'zod';

/**
 * Safely parse JSON string with TypeScript generics and proper error handling
 * @param jsonString - The JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed JSON or fallback value
 */
export function safeJsonParse<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString || jsonString.trim() === '') {
    return fallback;
  }
  
  try {
    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch (error) {
    console.error('JSON parsing failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      jsonString: jsonString.substring(0, 100) + (jsonString.length > 100 ? '...' : ''),
      fallback
    });
    return fallback;
  }
}

// Zod schemas for facility validation
export const facilityEquipmentSchema = z.array(z.string()).default([]);
export const facilityAmenitiesSchema = z.array(z.string()).default([]);

export const facilityCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['CLASSROOM', 'AUDITORIUM', 'LAB', 'MEETING_ROOM', 'STUDY_ROOM']),
  description: z.string().min(1, 'Description is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  location: z.string().min(1, 'Location is required'),
  building: z.string().min(1, 'Building is required'),
  floor: z.number().optional(),
  equipment: z.union([z.string(), z.array(z.string())]).default([]),
  amenities: z.union([z.string(), z.array(z.string())]).default([]),
  image_url: z.string().url().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE')
});

export const facilityUpdateSchema = facilityCreateSchema.partial();

/**
 * Safely parse and validate facility equipment/amenities arrays
 * @param data - Raw data that might be string or array
 * @param schema - Zod schema for validation
 * @returns Validated array or empty array as fallback
 */
export function parseFacilityArray(data: string | string[] | null | undefined, schema: z.ZodSchema<string[]>): string[] {
  try {
    if (Array.isArray(data)) {
      return schema.parse(data);
    }
    
    if (typeof data === 'string' && data.trim()) {
      const parsed = safeJsonParse<string[]>(data, []);
      return schema.parse(parsed);
    }
    
    return [];
  } catch (error) {
    console.error('Facility array parsing/validation failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      data
    });
    return [];
  }
}