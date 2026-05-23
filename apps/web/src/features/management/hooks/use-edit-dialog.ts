import { seerialQueryClient, useUpdate } from '@seerial/api';
import { useWebSocketStore } from '@seerial/stores';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  type FormConfig,
  generateDefaultValues,
  generateResetValues,
  generateSubmitData,
} from '@/features/management/components/dialogs/forms-config';
import useFormState from '@/shared/hooks/use-form-state';
import { showToast } from '@/shared/lib/react-utils';
import { useDialogStore } from '../stores/dialog-store';

interface UseEditDialogOptions<
  TEntity,
  TImages extends object,
  TUpdateDTO extends object = Record<string, unknown>
> {
  entity: TEntity | null;
  configs: FormConfig[];
  initialImages: TImages;
  getImagesFromEntity: (entity: TEntity) => Partial<TImages>;
  getExtraSubmitData: (images: TImages, entity: TEntity) => Record<string, unknown>;
  apiUpdateUrl: string;
  errorMessage: string;
  closeOnSuccess?: boolean;
  // Allowed keys based on the specific DTO
  dtoKeys?: (keyof TUpdateDTO)[];
}

function useEditDialog<
  TEntity extends object,
  TImages extends object,
  TUpdateDTO extends object = Record<string, unknown>
>({
  entity,
  configs,
  initialImages,
  getImagesFromEntity,
  getExtraSubmitData,
  apiUpdateUrl,
  errorMessage,
  closeOnSuccess = true,
  dtoKeys,
}: UseEditDialogOptions<TEntity, TImages, TUpdateDTO>) {
  const { t } = useTranslation();
  const connectWS = useWebSocketStore((state) => state.connectWS);
  const { isLoading: updating, error, update } = useUpdate();
  const { closeDialog } = useDialogStore();

  const { control, reset, handleSubmit } = useForm({
    defaultValues: generateDefaultValues(...configs),
  });

  const images = useFormState<TImages>(initialImages);
  const [selectedTab, setSelectedTab] = useState<string | undefined>();

  const { setFormState } = images;

  // biome-ignore lint/correctness/useExhaustiveDependencies: <No need to include generateResetValues and getImagesFromEntity in deps>
  useEffect(() => {
    if (!entity) return;
    reset(generateResetValues(entity, ...configs));
    setFormState(getImagesFromEntity(entity));
    setSelectedTab(t('generalButton'));
  }, [entity, reset, setFormState, t]);

  const handleUpdate = handleSubmit(async (data) => {
    if (updating) return;
    if (!entity) return;
    await connectWS();

    const submitData = generateSubmitData(data, entity, ...configs);

    // Object containing all information (including non-DTO fields like id, cast, etc.)
    const rawPayload: Record<string, unknown> = {
      ...submitData,
      ...getExtraSubmitData(images, entity),
    };

    // Filter the payload keeping ONLY the properties that exist in dtoKeys
    const finalPayload = dtoKeys
      ? dtoKeys.reduce<Partial<TUpdateDTO>>((acc, key) => {
        const stringKey = key as string;
        if (stringKey in rawPayload) {
          acc[key] = rawPayload[stringKey] as TUpdateDTO[keyof TUpdateDTO];
        }
        return acc;
      }, {})
      : rawPayload;

    const updatedData = await update(apiUpdateUrl, finalPayload);

    if (error || !updatedData) {
      showToast('error', errorMessage);
      return;
    }

    // Invalidate specified query keys to ensure fresh data is fetched
    seerialQueryClient.invalidateQueries();

    if (closeOnSuccess) closeDialog();
  });

  return {
    control,
    images,
    selectedTab,
    setSelectedTab,
    handleUpdate,
    closeDialog,
    t,
  };
}

export default useEditDialog;