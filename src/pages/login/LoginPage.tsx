import { Card, CardContent, CardHeader } from '@/components/ui/card'
import FlexBox from '@/components/ui/FlexBox'
import Login from './components/Login'

function LoginPage() {
  return (
    <FlexBox width={'100%'} height={'100%'} justify="center" align="center">
      <Card className="bg-secondary">
        <CardHeader className="gap-3 text-center">
          <h1 className="text-2xl font-semibold">Seerial Web</h1>
          <span>Inicia sesión con google</span>
        </CardHeader>
        <CardContent>
          <Login />
        </CardContent>
      </Card>
    </FlexBox>
  )
}

export default LoginPage
