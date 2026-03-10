import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  type FormConfig,
  generateDefaultValues,
  generateResetValues,
  generateSubmitData,
} from '@/components/dialogs/forms.config'
import { useDialogStore } from '@/context/dialog.store'
import { useWebSocketStore } from '@/context/ws.context'
import { useUpdate } from '@/hooks/media/useUpdate'
import useFormState from '@/hooks/useFormState'
import { showToast } from '@/utils/ReactUtils'

interface UseEditDialogOptions<TEntity, TImages extends Record<string, any>> {
  entity: TEntity | null
  configs: FormConfig[]
  initialImages: TImages
  getImagesFromEntity: (entity: TEntity) => Partial<TImages>
  getExtraSubmitData: (images: TImages, entity: TEntity) => Record<string, any>
  apiUpdateUrl: string
  errorMessage: string
  closeOnSuccess?: boolean
}

function useEditDialog<TEntity extends Record<string, any>, TImages extends Record<string, any>>({
  entity,
  configs,
  initialImages,
  getImagesFromEntity,
  getExtraSubmitData,
  apiUpdateUrl,
  errorMessage,
  closeOnSuccess = true,
}: UseEditDialogOptions<TEntity, TImages>) {
  const { t } = useTranslation()
  const connectWS = useWebSocketStore((state) => state.connectWS)
  const { isLoading: updating, error, update } = useUpdate()
  const { closeDialog } = useDialogStore()

  const { control, reset, handleSubmit } = useForm({
    defaultValues: generateDefaultValues(...configs),
  })

  const images = useFormState<TImages>(initialImages)
  const [selectedTab, setSelectedTab] = useState<string | undefined>()

  useEffect(() => {
    if (!entity) return
    reset(generateResetValues(entity, ...configs))
    images.setFormState(getImagesFromEntity(entity))
    setSelectedTab(t('generalButton'))
  }, [entity, reset])

  const handleUpdate = handleSubmit(async (data) => {
    if (updating) return
    await connectWS()

    const submitData = generateSubmitData(data, entity, ...configs)
    const updatedData = await update(apiUpdateUrl, {
      ...submitData,
      ...getExtraSubmitData(images, entity!),
    })

    if (error || !updatedData) {
      showToast('error', errorMessage)
      return
    }

    if (closeOnSuccess) closeDialog()
  })

  return {
    control,
    images,
    selectedTab,
    setSelectedTab,
    handleUpdate,
    closeDialog,
    t,
  }
}

export default useEditDialog
