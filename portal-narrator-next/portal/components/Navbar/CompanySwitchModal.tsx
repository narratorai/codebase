import { Modal, Select, Space, Tag } from 'antd-next'
import { ModalProps } from 'antd-next/es/modal'
import { RefSelectProps } from 'antd-next/es/select'
import { SearchSelect, SearchSelectOptionProps } from 'components/antd/staged'
import { useUser } from 'components/context/user/hooks'
import { Flex, Typography } from 'components/shared/jawns'
import Mark from 'components/shared/Mark'
import { ICompany, useGetCompaniesQuery } from 'graph/generated'
import { find, map, sortBy } from 'lodash'
import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { semiBoldWeight } from 'util/constants'

const { Option } = Select

const StyledModal = styled(Modal)`
  .antd5-modal-content {
    padding-right: 0;
    padding-left: 0;
  }
`

interface Props extends ModalProps {
  handleCompanySwitch: (selectedCompany: Partial<ICompany>) => void
  toggleSwitchCompanyModal: (value: boolean) => void
}

const CompanySwitchModal = ({ handleCompanySwitch, toggleSwitchCompanyModal }: Props) => {
  const { isSuperAdmin } = useUser()
  const selectRef = useRef<RefSelectProps>(null)
  const [hasFocused, setHasFocused] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(false)

  const { data: companiesData } = useGetCompaniesQuery()
  const sortedCompanies = sortBy(companiesData?.companies, 'name')

  const options = map(sortedCompanies, (comp) => ({
    key: `${comp.name}-${comp.slug}`,
    value: comp.slug,
    label: comp.name || 'UNKNOWN',
    company: comp,
    extraSearchValues: comp.status,
  }))

  const handleCreateOptionContent = ({
    searchValue,
    option,
  }: {
    searchValue: string
    option: SearchSelectOptionProps
  }) => (
    <Option key={option.value} label={option.label} value={option.value} disabled={option.disabled}>
      <Flex>
        <Space size={4} style={{ flex: 1 }}>
          <Typography as="span">
            <Mark value={option.label} snippet={searchValue} />
          </Typography>
          <Typography as="span" color="gray500">
            <Mark value={`(${option.company.slug})`} snippet={searchValue} />
          </Typography>
        </Space>
        {isSuperAdmin && (
          <Tag
            color={
              option.company.status === 'onboarding'
                ? 'processing'
                : option.company.status === 'active'
                  ? 'success'
                  : 'default'
            }
          >
            <Mark value={option.company.status} snippet={searchValue} />
          </Tag>
        )}
      </Flex>
    </Option>
  )

  // SearchSelect's autofocus isn't working in this modal
  // check for focus and set it manually
  // also wait for modal to fully render before opening dropdown
  useEffect(() => {
    if (!hasFocused && !!selectRef?.current) {
      setHasFocused(true)
      selectRef?.current?.focus()

      // defer opening dropdown to allow for modal to fully render
      // otherwise dropdown won't be aligned correctly
      setTimeout(() => {
        setOpenDropdown(true)
      }, 300)
    }
  }, [hasFocused])

  return (
    <StyledModal
      footer={null}
      open
      title={
        <Typography type="title400" fontWeight={semiBoldWeight} ml={2}>
          Switch Company
        </Typography>
      }
      onCancel={() => toggleSwitchCompanyModal(false)}
    >
      <SearchSelect
        style={{ width: '100%' }}
        size="large"
        open={openDropdown}
        optionFilterProp="key"
        bordered={false}
        selectRef={selectRef}
        onSelect={(companySlug: string) => {
          const selectedCompany = find(sortedCompanies, { slug: companySlug }) as Partial<ICompany>

          toggleSwitchCompanyModal(false)
          handleCompanySwitch(selectedCompany)
        }}
        createOptionContent={handleCreateOptionContent}
        options={options}
      />
    </StyledModal>
  )
}

export default CompanySwitchModal
