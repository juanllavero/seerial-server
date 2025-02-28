import { useServerStore } from '@/context/server.context'
import { FormField, useForm } from '@/hooks/useForm'
import React from 'react'
import { z } from 'zod'

const formSchema = z.object({
  serverIp: z
    .string()
    .min(2, { message: 'The Server IP has to be at least 3 characters.' }),
})

type FormValues = z.infer<typeof formSchema>

const formFields: FormField<FormValues>[] = [
  {
    name: 'serverIp',
    label: 'Server IP',
    type: 'text',
    placeholder: 'ex: 89.207.132.170:3000',
  },
]

export const AddServerForm = () => {
  const { setServerIP } = useServerStore()
  const form = useForm<FormValues>(formSchema, formFields, {
    defaultValues: {
      serverIp: '',
    },
  })

  const onSubmit = (data: FormValues) => {
    setServerIP(data.serverIp)
  }

  return <div className="mx-auto max-w-md">{form.renderForm(onSubmit)}</div>
}
