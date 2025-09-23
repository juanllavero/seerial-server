import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/auth.context'
import React from 'react'
import { useTranslation } from 'react-i18next'

function ProfileSettingsTab() {
  const { t } = useTranslation()
  const { user, changeUserName } = useAuth()
  const [userName, setUserName] = React.useState<string>(user?.name || '')
  const [disableButton, setDisableButton] = React.useState(false)
  return (
    <FlexBox direction="column" gap={1} width={'100%'} maxWidth={'30rem'}>
      <LabeledInputWrapper label={t('name')}>
        <Input
          type="text"
          value={userName}
          placeholder={`${t('name')}...`}
          onChange={(e) => setUserName(e.target.value)}
        />
      </LabeledInputWrapper>

      {user?.name !== userName && (
        <Button
          disabled={disableButton}
          onClick={async () => {
            setDisableButton(true)
            await changeUserName(userName)
            setDisableButton(false)
          }}
        >
          {t('saveButton')}
        </Button>
      )}
    </FlexBox>
  )
}

export default ProfileSettingsTab
