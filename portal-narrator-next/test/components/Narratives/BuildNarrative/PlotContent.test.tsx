// commented out much of this code as jest running into error:
// SyntaxError: Unexpected token 'export'
// https://github.com/narratorai/portal-narrator-next/actions/runs/6201818860/job/16840064659

import {
  // render,
  screen,
} from '@testing-library/react'
// import { noop } from 'lodash'
// import { Form } from 'react-final-form'

// import { NonAdminTestContext } from '../../../context'

// import PlotContent from '../../../../portal/components/Narratives/BuildNarrative/Sections/BasicContent/PlotContent'

// const setCompileDisabled = () => noop
// const compileContentRef = { current: null }
// const refreshInputOptionsRef = { current: null }

// TODO: update tests once we fix this issue:
// https://github.com/ant-design/ant-design/issues/21096
describe.skip('Non admin user in a narrative', () => {
  // beforeEach(() => {
  //   render(
  //     <NonAdminTestContext>
  //       <Form
  //         onSubmit={noop}
  //         render={() => (
  //           <PlotContent
  //             isDashboard={false}
  //             fieldName="narrative.sections[0].content[0]"
  //             setCompileDisabled={setCompileDisabled}
  //             compileContentRef={compileContentRef}
  //             refreshInputOptionsRef={refreshInputOptionsRef}
  //           />
  //         )}
  //       />
  //     </NonAdminTestContext>
  //   )
  // })

  test('renders correctly with dataset, plot, color, and height slider', async () => {
    expect(screen.getByText('Select Dataset')).toBeInTheDocument()
    expect(screen.getByText('Select Plot')).toBeInTheDocument()
    expect(screen.getByText('Override Theme Colors')).toBeInTheDocument()
    expect(screen.getByText('Plot Height')).toBeInTheDocument()
  })
})

describe.skip('Non admin user in a dashboard', () => {
  // beforeEach(() => {
  //   render(
  //     <NonAdminTestContext>
  //       <Form
  //         onSubmit={noop}
  //         render={() => (
  //           <PlotContent
  //             isDashboard={true}
  //             fieldName="narrative.sections[0].content[0]"
  //             setCompileDisabled={setCompileDisabled}
  //             compileContentRef={compileContentRef}
  //             refreshInputOptionsRef={refreshInputOptionsRef}
  //           />
  //         )}
  //       />
  //     </NonAdminTestContext>
  //   )
  // })

  test('renders correctly with dataset, plot, and color', async () => {
    expect(screen.getByText('Select Dataset')).toBeInTheDocument()
    expect(screen.getByText('Select Plot')).toBeInTheDocument()
    expect(screen.getByText('Override Theme Colors')).toBeInTheDocument()
    expect(screen.getByText('Plot Height')).not.toBeInTheDocument()
  })
})
