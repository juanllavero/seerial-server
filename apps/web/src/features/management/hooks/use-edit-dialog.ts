import { useUpdate } from '@seerial/api';
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

interface UseEditDialogOptions<TEntity, TImages extends object> {
  entity: TEntity | null;
  configs: FormConfig[];
  initialImages: TImages;
  getImagesFromEntity: (entity: TEntity) => Partial<TImages>;
  getExtraSubmitData: (images: TImages, entity: TEntity) => Record<string, unknown>;
  apiUpdateUrl: string;
  errorMessage: string;
  closeOnSuccess?: boolean;
}

function useEditDialog<TEntity extends object, TImages extends object>({
  entity,
  configs,
  initialImages,
  getImagesFromEntity,
  getExtraSubmitData,
  apiUpdateUrl,
  errorMessage,
  closeOnSuccess = true,
}: UseEditDialogOptions<TEntity, TImages>) {
  const { t } = useTranslation();
  const connectWS = useWebSocketStore((state) => state.connectWS);
  const { isLoading: updating, error, update } = useUpdate();
  const { closeDialog } = useDialogStore();

  const { control, reset, handleSubmit } = useForm({
    defaultValues: generateDefaultValues(...configs),
  });

  const images = useFormState<TImages>(initialImages);
  const [selectedTab, setSelectedTab] = useState<string | undefined>();

  useEffect(() => {
    if (!entity) return;
    reset(generateResetValues(entity, ...configs));
    images.setFormState(getImagesFromEntity(entity));
    setSelectedTab(t('generalButton'));
  }, [entity, reset]);

  const handleUpdate = handleSubmit(async (data) => {
    if (updating) return;
    if (!entity) return;
    await connectWS();

    const submitData = generateSubmitData(data, entity, ...configs);
    const updatedData = await update(apiUpdateUrl, {
      ...submitData,
      ...getExtraSubmitData(images, entity),
    });

    if (error || !updatedData) {
      showToast('error', errorMessage);
      return;
    }

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
