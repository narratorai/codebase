import { assign, createMachine } from 'xstate'

function isCompanyAddressValid(_: OnboardingMachineContext): boolean {
  throw Error('Not implemented')
}

export interface OnboardingMachineContext {
  companyAddress?: ICompanyAddress
  invitedUsers?: InvitedUser[]
}

export interface ICompanyAddress {
  name: string
  address: {
    country: string
    line1: string
    city: string
    state?: string
  }
}

export interface InvitedUser {
  name: string
  email: string
  role: 'admin' | 'user'
}

export type OnboardingMachineEvent =
  | {
      type: 'BACK'
    }
  | {
      type: 'SUBMIT_COMPANY_ADDRESS'
      info: ICompanyAddress
    }
  | {
      type: 'INVITE_USERS'
      info: ICompanyAddress
    }
  | {
      type: 'SUBMIT_INVITED_USERS'
      info: InvitedUser[]
    }
  | {
      type: 'PAYMENT_SUCCESS'
    }
  | {
      type: 'PAYMENT_FAILED'
    }

const onboardingMachine = createMachine<OnboardingMachineContext, OnboardingMachineEvent>(
  {
    id: 'onboardingForm',
    initial: 'enteringCompanyAddress',
    states: {
      enteringCompanyAddress: {
        on: {
          SUBMIT_COMPANY_ADDRESS: {
            target: 'enteringPaymentMethod',
            actions: [assign({ companyAddress: (_, event) => event.info })],
          },
          INVITE_USERS: {
            target: 'invitingUsers',
            actions: [assign({ companyAddress: (_, event) => event.info })],
          },
        },
      },
      invitingUsers: {
        on: {
          SUBMIT_INVITED_USERS: [
            {
              target: 'enteringPaymentMethod',
              actions: [assign({ invitedUsers: (_, event) => event.info })],
              cond: isCompanyAddressValid,
            },
            {
              target: 'enteringCompanyAddress',
              actions: [assign({ invitedUsers: (_, event) => event.info })],
            },
          ],
          BACK: 'enteringCompanyAddress',
        },
      },
      enteringPaymentMethod: {
        on: {
          PAYMENT_SUCCESS: 'success',
          PAYMENT_FAILED: 'enteringPaymentMethod',
          BACK: 'enteringCompanyAddress',
        },
      },
      success: {
        type: 'final',
      },
    },
  },
  {
    guards: {
      isCompanyAddressValid,
    },
  }
)

export default onboardingMachine
