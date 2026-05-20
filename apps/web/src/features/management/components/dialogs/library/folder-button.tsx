import { X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import FlexBox from '@/shared/ui/flex-box';

interface FolderButtonProps {
  folder: string;
  removeFolder: (folder: string) => void;
}

function FolderButton({ folder, removeFolder }: FolderButtonProps) {
  return (
    <FlexBox
      gap={1}
      width={'100%'}
      align="center"
      justify="space-between"
      padding="0.2rem 0.5rem"
      css={{ backgroundColor: '#595959', borderRadius: '5px' }}
    >
      <span className="mr-2 ml-1">{folder}</span>
      <Button variant={'ghost'} size={'icon'} onClick={() => removeFolder(folder)}>
        <X />
      </Button>
    </FlexBox>
  );
}

export default FolderButton;
