import React, { useState, useEffect, JSX } from 'react'
import {
  useForm as useHookForm,
  type UseFormProps,
  type FieldValues,
  type UseFormReturn,
  type Path,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { Lock, Unlock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectGroup,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'

export type FormField<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>
  label: string
  type: 'text' | 'textarea' | 'select' | 'checkbox'
  options?: { label: string; value: string }[]
  description?: string
  placeholder?: string
  hasLock?: boolean // Indicates if the field has an associated lock
  disabled?: boolean // Add disabled property
}

type UseFormExtendedReturn<TFieldValues extends FieldValues> =
  UseFormReturn<TFieldValues> & {
    renderForm: (onSubmit: (data: TFieldValues) => void) => JSX.Element
  }

export function useForm<TFieldValues extends FieldValues>(
  schema: z.ZodType<TFieldValues>,
  fields: FormField<TFieldValues>[],
  options?: UseFormProps<TFieldValues>,
): UseFormExtendedReturn<TFieldValues> {
  const form = useHookForm<TFieldValues>({
    resolver: zodResolver(schema),
    ...options,
  })

  // Initialize locks based on fields with hasLock property
  const initialLocks = fields.reduce(
    (acc, field) => {
      if (field.hasLock) {
        acc[`${field.name}Lock`] = false
      }
      return acc
    },
    {} as Record<string, boolean>,
  )

  const [locks, setLocks] = useState(initialLocks)

  // Update form values when locks change
  useEffect(() => {
    Object.entries(locks).forEach(([key, value]) => {
      form.setValue(key as Path<TFieldValues>, value)
    })
  }, [locks, form])

  const toggleLock = (field: Path<TFieldValues>) => {
    const lockField = `${field}Lock` as Path<TFieldValues>
    setLocks((prev) => {
      const newLocks = { ...prev, [lockField]: !prev[lockField] }
      return newLocks
    })
  }

  const renderForm = (onSubmit: (data: TFieldValues) => void) => (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-8"
      >
        {fields.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <div className="flex items-center space-x-2">
                  {field.hasLock && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => toggleLock(field.name)}
                    >
                      {locks[`${field.name}Lock`] ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Unlock className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <FormControl>
                    <>
                      {field.type === 'text' && (
                        <Input
                          {...formField}
                          placeholder={field.placeholder}
                          disabled={field.disabled} // Add disabled prop to Input
                        />
                      )}
                      {field.type === 'textarea' && (
                        <Textarea
                          {...formField}
                          placeholder={field.placeholder}
                          disabled={field.disabled} // Add disabled prop to Textarea
                        />
                      )}
                      {field.type === 'select' && (
                        <Select
                          onValueChange={formField.onChange}
                          defaultValue={formField.value}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={field.placeholder} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {field.options?.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                      {field.type === 'checkbox' && (
                        <Checkbox
                          checked={formField.value as boolean}
                          onCheckedChange={formField.onChange}
                          disabled={field.disabled} // Add disabled prop to Checkbox
                        />
                      )}
                    </>
                  </FormControl>
                </div>
                {field.description && (
                  <FormDescription>{field.description}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )

  return {
    ...form,
    renderForm,
  }
}
