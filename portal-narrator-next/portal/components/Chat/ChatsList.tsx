import { List } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { Link } from 'components/shared/jawns'
import { IRemoteChats } from 'portal/stores/chats'
import { useHistory } from 'react-router'
import styled from 'styled-components'
import { colors, semiBoldWeight } from 'util/constants'
import { timeFromNow } from 'util/helpers'

const StyledItem = styled(List.Item)<{ isSelected: boolean }>`
  padding: 0 !important;
  border-block-end-color: ${colors.mavis_light_gray};
  background-color: ${({ isSelected }) => (isSelected ? colors.blue200 : 'inherit')};

  &:hover {
    background-color: ${colors.blue100};
    cursor: pointer;
  }
`

const StyledLink = styled(Link)`
  padding: 16px;
  display: block;
  width: 100%;
`

const SytledListItemMeta = styled(List.Item.Meta)`
  border-radius: 4px;
  border-block-end-color: ${colors.mavis_light_gray};

  .antd5-list-item-meta-description {
    color: ${colors.gray500};
    font-weight: ${semiBoldWeight};
  }
`

interface Props {
  items: IRemoteChats
  isLoading: boolean
}

const ChatsList = ({ items, isLoading }: Props) => {
  const company = useCompany()
  const history = useHistory()

  return (
    <List
      dataSource={items}
      loading={isLoading}
      renderItem={(item) => (
        <StyledItem isSelected={history.location.pathname.includes(item.id)}>
          <StyledLink to={`/chat/${item.id}`} key={item.id} unstyled selected>
            <SytledListItemMeta title={item.question} description={timeFromNow(item.created_at, company?.timezone)} />
          </StyledLink>
        </StyledItem>
      )}
    />
  )
}

export default ChatsList
