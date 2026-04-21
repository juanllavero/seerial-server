import { useCallback, useMemo, useState } from 'react';

type FormState<T> = {
  [K in keyof T]: T[K];
};

type FormSetters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void;
};

type UseFormStateReturn<T> = FormState<T> &
  FormSetters<T> & {
    setFormState: (values: Partial<T>) => void;
    resetFormState: (values?: Partial<T>) => void;
  };

/**
 * Custom hook for managing form state automatically
 * Eliminates the need for multiple useState calls
 *
 * @template T - The interface/type of your form data
 * @param schema - An object defining the keys of your form (e.g., { type: '', name: '', folders: [] })
 * @param initialValues - Optional initial values for the form
 * @returns Form state values, individual setters for each field, and helper methods
 *
 * @example
 * interface LibraryForm {
 *   type: string | undefined
 *   name: string
 *   language: string | undefined
 *   folders: string[]
 * }
 *
 * const form = useFormState<LibraryForm>(
 *   { type: undefined, name: '', language: undefined, folders: [] },
 *   { name: 'My Library' }
 * )
 *
 * // Access values
 * form.type            // Current type value
 * form.setType(value)  // Update type value
 * form.setFormState({ type: 'Movies', name: 'New Name' }) // Update multiple
 * form.resetFormState() // Reset to initial values
 */
function useFormState<T extends object>(
  schema: T,
  initialValues?: Partial<T>,
): UseFormStateReturn<T> {
  const [formState, setFormStateInternal] = useState<FormState<T>>(() => ({
    ...schema,
    ...initialValues,
  }));

  // Helper to update multiple form state values at once
  const setFormState = useCallback((values: Partial<T>) => {
    setFormStateInternal((prev) => ({ ...prev, ...values }));
  }, []);

  // Helper to reset form state to initial values
  const resetFormState = useCallback(
    (values?: Partial<T>) => {
      setFormStateInternal({
        ...schema,
        ...values,
      });
    },
    [schema],
  );

  // Dynamically create setters for each form field — memoized so references are stable across renders
  // biome-ignore lint/correctness/useExhaustiveDependencies: setters rely only on setFormStateInternal (stable useState setter) and schema keys (constant per hook instance); no deps needed
  const setters = useMemo(() => {
    const result = {} as FormSetters<T>;

    for (const key of Object.keys(schema) as Array<Extract<keyof T, string>>) {
      if (Object.hasOwn(schema, key)) {
        const setterName =
          `set${key.charAt(0).toUpperCase()}${key.slice(1)}` as keyof FormSetters<T>;
        const setter = (value: T[typeof key]) => {
          setFormStateInternal((prev) => ({ ...prev, [key]: value }));
        };
        result[setterName] = setter as FormSetters<T>[typeof setterName];
      }
    }

    return result;
  }, []);

  return {
    ...formState,
    ...setters,
    setFormState,
    resetFormState,
  } as UseFormStateReturn<T>;
}

export default useFormState;
