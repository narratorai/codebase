import { DownOutlined, InfoCircleOutlined, UpOutlined } from '@ant-design/icons'
import {
  ArrayFieldTemplateProps,
  FieldTemplateProps as RJSFFieldTemplateProps,
  ObjectFieldTemplateProps,
} from '@rjsf/core'
import { Button, Tooltip } from 'antd-next'
import OutlinedAddButton from 'components/antd/OutlinedAddButton'
import InfoModal from 'components/shared/DynamicForm/InfoModal'
import { Box, Flex, Label, Link, ListItemCard, Typography } from 'components/shared/jawns'
import { get, isString, noop, pick, startsWith } from 'lodash'
import React from 'react'
import styled from 'styled-components'
import { IFormContext } from 'util/blocks/interfaces'

import ObjectFieldTabs from './FormWidgets/ObjectFieldTabs'

const ALLOWABLE_BOX_PROPS = ['width', 'p', 'px', 'py', 'pl', 'pr', 'm', 'mx', 'my', 'mb', 'bg']

//
// Components for rendering the form. This is so that we can use jawns for styling
//

const BottomBorder = styled(Box)`
  border-bottom: 2px solid ${(props) => props.theme.colors.gray300};
`

const HelpIcon = styled.span`
  margin-left: 8px;
`

//
// Templates - these wrap specific inputs and provide things like labels and children
//

interface FieldTemplateProps extends RJSFFieldTemplateProps {
  formContext: IFormContext
}

export const FieldTemplate: React.FC<FieldTemplateProps> = (props) => {
  const { id, label, displayLabel, rawHelp, hidden, required, errors, children, uiSchema, formContext } = props

  // Hide label for all of our Boolean override fields (BooleanButtonWidget and BooleanToggleWidget)
  // as well as QueryWithScratchpadWidget
  const widget = get(uiSchema, 'ui:widget', '')
  const shouldDisplayLabel =
    isString(widget) && (startsWith(widget, 'Boolean') || widget === 'QueryWithScratchpadWidget') ? false : displayLabel

  //
  // Subscribe to graphql updates to automatically refresh the form
  //
  const graphQuery = get(uiSchema, 'ui:options.graph_subscription')
  if (graphQuery && formContext.subscribeToRefresh) {
    const variables = get(uiSchema, 'ui:options.graph_subscription_inputs')
    formContext.subscribeToRefresh({ fieldSlug: id, graphQuery, variables })
  }

  // Make sure if field is marked as hidden to not show any of the stuff surrounding it
  // (labels, descriptions, errors, etc...)
  if (hidden) {
    return null
  }

  // <Box> props support to help with layout:
  const outerBoxProps = pick(get(uiSchema, 'ui:options.outer_box_props', { width: 1, mb: 2 }), ALLOWABLE_BOX_PROPS)

  let innerBoxProps = pick(get(uiSchema, 'ui:options.inner_box_props', { width: 1 }), ALLOWABLE_BOX_PROPS)
  // Currently only checking for floats in button wrapper style (since we now use flex instead of box)
  // TODO: update innerBoxProps over-ride w/ other Mavis css that don't work with flex
  const buttonWrapperStyle = get(uiSchema, 'ui:options.button_wrapper_style')
  if (buttonWrapperStyle?.float === 'right') {
    innerBoxProps = {
      ...innerBoxProps,
      justifyContent: 'end',
    }
  }

  // bottom border support:
  const showBottomBorder = get(uiSchema, 'ui:options.bottom_border', false)

  const showTooltip = rawHelp && shouldDisplayLabel ? 'label' : rawHelp ? 'children' : null

  const infoModalMarkdown = get(uiSchema, 'ui:info_modal')

  // note: we're not showing the description
  return (
    <Box {...outerBoxProps}>
      {shouldDisplayLabel && (
        <Flex mb="4px" alignItems="baseline">
          <Label htmlFor={id}>
            {label}
            {required ? '*' : null}
          </Label>
          {showTooltip === 'label' && (
            <HelpIcon data-public>
              <Tooltip title={rawHelp}>
                <InfoCircleOutlined />
              </Tooltip>
            </HelpIcon>
          )}
          {infoModalMarkdown && (
            <HelpIcon data-public>
              <InfoModal markdown={infoModalMarkdown} />
            </HelpIcon>
          )}
        </Flex>
      )}

      <Flex {...innerBoxProps} alignItems="baseline">
        {showTooltip === 'children' ? (
          <Tooltip title={rawHelp} placement="bottom">
            <span>{children}</span>
          </Tooltip>
        ) : (
          children
        )}

        {infoModalMarkdown && !shouldDisplayLabel && (
          <HelpIcon data-public>
            <InfoModal markdown={infoModalMarkdown} />
          </HelpIcon>
        )}
      </Flex>
      {errors}

      {showBottomBorder && <BottomBorder my={4} />}
    </Box>
  )
}

export const ObjectFieldTemplate: React.FC<ObjectFieldTemplateProps> = (props: any) => {
  const { DescriptionField, description, TitleField, title, idSchema, uiSchema, properties } = props

  // root means this is the form itself
  const isRoot = idSchema.$id === 'root'
  const contentMargin = 0

  // <Box> props support:
  const boxProps = pick(get(uiSchema, 'ui:options.box_props', { width: 1, mb: 2 }), ALLOWABLE_BOX_PROPS)

  // bottom border support:
  const showBottomBorder = get(uiSchema, 'ui:options.bottom_border', false)

  // So we can support field layout as side by side
  const flexDirection = get(uiSchema, 'ui:options.flex_direction', 'row')
  const flexWrap = get(uiSchema, 'ui:options.flex_wrap', 'wrap')

  // allow for hiding title
  const showTitle = get(uiSchema, 'ui:options.title', true)

  // Support for root level tabs!
  const tabsConfig = get(uiSchema, 'ui:tabs')
  const useTabs = isRoot && tabsConfig

  return (
    <Box {...boxProps}>
      {showTitle && (
        <Box mb={contentMargin}>
          <TitleField title={title} isRoot={isRoot} />
          <DescriptionField description={description} />
        </Box>
      )}
      {useTabs && (
        <ObjectFieldTabs
          flexDirection={flexDirection}
          flexWrap={flexWrap}
          properties={properties}
          tabsConfig={tabsConfig}
        />
      )}
      {!useTabs && (
        <Flex flexDirection={flexDirection} flexWrap={flexWrap}>
          {properties.map((element: any) => element.content)}
        </Flex>
      )}
      {showBottomBorder && <BottomBorder my={4} />}
    </Box>
  )
}

export const ArrayFieldTemplate: React.FC<ArrayFieldTemplateProps> = (props: any) => {
  const { TitleField, title, DescriptionField, description, disabled, uiSchema, items, onAddClick } = props

  // allow for hiding title
  const showTitle = get(uiSchema, 'ui:options.title', true)

  return (
    <Box mb={2} width="100%">
      <Box>
        {showTitle && (
          <>
            <TitleField title={title} />
            <DescriptionField description={description} />
          </>
        )}
        {items.map((element: any) => (
          // the unusual padding is so the X button lines up with the up and down buttons
          <ListItemCard
            bg="white"
            pt={1}
            pl="0px"
            pr={4}
            mb={1}
            key={element.key}
            // Support ui:options removable
            removable={element.hasRemove}
            onClose={!disabled ? element.onDropIndexClick(element.index) : noop}
            ctaMessage=""
          >
            {/* Support ui:options orderable */}
            {(element.hasMoveUp || element.hasMoveDown) && (
              <Flex justifyContent="flex-end" data-public>
                <Box mr={2}>
                  <Link
                    disabled={!element.hasMoveUp}
                    onClick={element.hasMoveUp ? element.onReorderClick(element.index, element.index - 1) : noop}
                  >
                    <Button shape="circle" size="small">
                      <UpOutlined />
                    </Button>
                  </Link>
                </Box>

                <Box mr={2}>
                  <Link
                    disabled={!element.hasMoveDown}
                    onClick={element.hasMoveDown ? element.onReorderClick(element.index, element.index + 1) : noop}
                  >
                    <Button shape="circle" size="small">
                      <DownOutlined />
                    </Button>
                  </Link>
                </Box>
              </Flex>
            )}

            {element.children}
          </ListItemCard>
        ))}
      </Box>
      {/* Support ui:options addable */}
      {props.canAdd && <OutlinedAddButton onClick={onAddClick}>Add another item</OutlinedAddButton>}
    </Box>
  )
}

export const DescriptionField = (props: any) => {
  return (
    <Typography type="body50" mb={1} data-public>
      {props.description}
    </Typography>
  )
}

export const TitleField = (props: any) => {
  const titleType = props.isRoot ? 'title300' : 'title400'

  return (
    <Typography type={titleType} mb={1} data-public>
      {props.title}
    </Typography>
  )
}
