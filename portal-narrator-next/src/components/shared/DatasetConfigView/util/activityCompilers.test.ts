import { compileAppendActivities, compileCohortActivity } from './activityCompilers'

const cohortActivity = {
  displayName: 'Opened Email',
  fetchType: 'all',
}

describe('compileCohortActivity', () => {
  it('should return tokens that produce "All <pt>Opened Email</pt>"', () => {
    const result = compileCohortActivity(cohortActivity)
    const expected = [
      { format: 'regular', value: 'All' },
      { format: 'regular', value: ' ' },
      { format: 'purpleTag', value: 'Opened Email' },
    ]
    expect(result).toEqual(expected)
  })
})

describe('compileAppendActivities', () => {
  it('should return tokens that produce "Append last <ppt>Completed Order</ppt>" after <b>Opened Email</b> Append first <ppt>Placed Order</ppt>" in between <b>Opened Email</b>"', () => {
    const activities = [
      {
        displayName: 'Completed Order',
        relation: 'after',
        fetchType: 'last',
      },
      {
        displayName: 'Placed Order',
        relation: 'in_between',
        fetchType: 'first',
      },
    ]
    const result = compileAppendActivities(activities, cohortActivity)
    const expected = [
      [
        { format: 'regular', value: 'Append' },
        { format: 'regular', value: ' ' },
        { format: 'regular', value: 'last' },
        { format: 'regular', value: ' ' },
        { format: 'pinkPurpleTag', value: 'Completed Order' },
        { format: 'regular', value: ' ' },
        { format: 'regular', value: 'after' },
        { format: 'regular', value: ' ' },
        { format: 'bold', value: 'Opened Email' },
      ],
      [
        { format: 'regular', value: 'Append' },
        { format: 'regular', value: ' ' },
        { format: 'regular', value: 'first' },
        { format: 'regular', value: ' ' },
        { format: 'pinkPurpleTag', value: 'Placed Order' },
        { format: 'regular', value: ' ' },
        { format: 'regular', value: 'in between' },
        { format: 'regular', value: ' ' },
        { format: 'bold', value: 'Opened Email' },
      ],
    ]
    expect(result).toEqual(expected)
  })
})
