import { Card, CardContent, CardHeader } from '@/components/ui/card'
import FlexBox from '@/components/ui/FlexBox'
import { getToken } from '@/lib/auth'
import { useNavigate } from 'react-router-dom'
import Login from './components/Login'
import { useAuth } from '@/context/auth.context'

function LoginPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const token = getToken()

  if (token || user) navigate('/home')

  return (
    <FlexBox width={'100%'} height={'100dvh'} justify="center" align="center">
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
