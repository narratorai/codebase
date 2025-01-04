import { ITokenFormat } from './interfaces'
import TokenTag from './TokenTag'

interface Props {
  format: ITokenFormat
  children: React.ReactNode
}

const Token = ({ format, children }: Props) => (
  <>
    {format === 'regular' && <span>{children}</span>}
    {format === 'bold' && <span className="font-bold">{children}</span>}
    {format === 'greenTag' && <TokenTag color="green">{children}</TokenTag>}
    {format === 'purpleTag' && <TokenTag color="purple">{children}</TokenTag>}
    {format === 'pinkPurpleTag' && <TokenTag color="pink-purple">{children}</TokenTag>}
  </>
)

export default Token
