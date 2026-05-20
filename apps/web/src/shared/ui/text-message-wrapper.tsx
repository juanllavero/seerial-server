import { AlertCircle, Check } from 'lucide-react';
import { Alert, AlertDescription } from './alert';
import FlexBox from './flex-box';

interface TextMessageWrapperProps {
  message: string;
  error?: boolean;
}

function TextMessageWrapper({ message, error = false }: TextMessageWrapperProps) {
  return (
    <Alert variant={error ? 'destructive' : 'success'}>
      <FlexBox justify="start" align="center" gap={1}>
        {error ? <AlertCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
        <AlertDescription>{message}</AlertDescription>
      </FlexBox>
    </Alert>
  );
}

export default TextMessageWrapper;
