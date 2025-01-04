import type { Meta, StoryObj } from '@storybook/react'

import { Description, ErrorMessage, Field, FieldGroup, Fieldset, Label, Legend } from '.'

/**
 * Use Fieldset primitive component to define a form fieldset.
 */
const meta: Meta<typeof Fieldset> = {
  component: Fieldset,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta

export const FieldWithLabel: StoryObj<typeof Field> = {
  argTypes: {
    children: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    children: 'Label',
    disabled: false,
  },
  render: ({ children, ...args }) => (
    <Field {...args}>
      <Label>{children}</Label>
    </Field>
  ),
}

export const FieldWithDescription: StoryObj<typeof Field> = {
  argTypes: {
    children: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    children: 'Description',
    disabled: false,
  },
  render: ({ children, ...args }) => (
    <Field {...args}>
      <Description>{children}</Description>
    </Field>
  ),
}

export const FieldWithErrorMessage: StoryObj<typeof Field> = {
  argTypes: {
    children: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    children: 'Error message',
    disabled: false,
  },
  render: ({ children, ...args }) => (
    <Field {...args}>
      <ErrorMessage>{children}</ErrorMessage>
    </Field>
  ),
}

export const FieldWithLabelAndDescription: StoryObj<{ label: string; description: string; disabled: boolean }> = {
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    label: 'Label',
    description: 'Description',
    disabled: false,
  },
  render: ({ label, description, ...args }) => (
    <Field {...args}>
      <Label>{label}</Label>
      <Description>{description}</Description>
    </Field>
  ),
}

export const FieldWithLabelAndErrorMessage: StoryObj<{ label: string; errorMessage: string; disabled: boolean }> = {
  argTypes: {
    label: { control: 'text' },
    errorMessage: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    label: 'Label',
    errorMessage: 'Error message',
    disabled: false,
  },
  render: ({ label, errorMessage, ...args }) => (
    <Field {...args}>
      <Label>{label}</Label>
      <ErrorMessage>{errorMessage}</ErrorMessage>
    </Field>
  ),
}

export const FieldsInFieldGroup: StoryObj<typeof FieldGroup> = {
  render: () => (
    <FieldGroup>
      <Field>
        <Label>First label</Label>
        <Description>Description</Description>
      </Field>

      <Field>
        <Label>Second label</Label>
        <ErrorMessage>Error message</ErrorMessage>
      </Field>
    </FieldGroup>
  ),
}

export const FieldsetWithLegend: StoryObj<typeof Fieldset> = {
  argTypes: {
    children: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    children: 'Legend',
    disabled: false,
  },
  render: ({ children, ...args }) => (
    <Fieldset {...args}>
      <Legend>{children}</Legend>
    </Fieldset>
  ),
}

export const FieldGroupsInFieldset: StoryObj<typeof Fieldset> = {
  argTypes: {
    disabled: { control: 'boolean' },
  },
  args: {
    disabled: false,
  },
  render: (args) => (
    <Fieldset {...args}>
      <Legend>Fieldset legend</Legend>
      <FieldGroup>
        <Field>
          <Label>First label</Label>
          <Description>First description content</Description>
        </Field>
        <Field>
          <Label>Second label</Label>
          <ErrorMessage>First error message</ErrorMessage>
        </Field>
      </FieldGroup>
      <FieldGroup>
        <Field>
          <Label>Third label</Label>
          <Description>Second description content</Description>
        </Field>
        <Field>
          <Label>Fourth label</Label>
          <ErrorMessage>Second error message</ErrorMessage>
        </Field>
      </FieldGroup>
    </Fieldset>
  ),
}
