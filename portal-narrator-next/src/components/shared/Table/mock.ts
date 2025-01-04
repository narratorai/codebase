import { Comparator, DisplayFormat, IRemoteDataTable } from '@/stores/datasets'

const mockData: IRemoteDataTable = {
  columns: [
    {
      field: 'id',
      headerName: 'ID',
      type: DisplayFormat.Decimal,
      width: 300,
      autoHeight: true,
      flex: 1,
    },
    {
      field: 'name',
      headerName: 'Name',
      type: DisplayFormat.String,
      autoHeight: true,
      flex: 1,
      context: {},
    },
    {
      field: 'age',
      headerName: 'Age',
      type: DisplayFormat.Decimal,
      pinned: 'right',
      autoHeight: true,
      flex: 1,
      context: {
        styleConditions: [
          {
            comparator: Comparator.GreaterThan,
            thresholdValue: 27,
            cellStyle: { color: 'green', fontStyle: 'italic', fontWeight: 'bold', backgroundColor: '#DEFFED' },
          },
          { comparator: Comparator.LessThan, thresholdValue: 27, cellStyle: { color: 'blue' } },
        ],
      },
    },
    {
      field: 'networth',
      headerName: 'Net Worth',
      type: DisplayFormat.TickerDecimal,
      autoHeight: true,
      flex: 1,
      context: {},
    },
    {
      field: 'location',
      headerName: 'Location',
      autoHeight: true,
      flex: 1,
      children: [
        {
          field: 'country',
          headerName: 'Country',
          type: DisplayFormat.String,
          context: {
            styleConditions: [
              {
                comparator: Comparator.Always,
                thresholdValue: 'USA',
                cellStyle: { borderLeftColor: 'red', borderRightColor: 'red' },
              },
              { comparator: Comparator.LessThan, thresholdValue: 27, cellStyle: { color: 'blue' } },
            ],
          },
        },
        {
          field: 'city',
          headerName: 'City',
          type: DisplayFormat.String,
          wrapText: true,
        },
      ],
    },
  ],
  rows: [
    {
      id: 1,
      name: 'Alice',
      age: 30,
      networth: 100000,
      country: 'USA',
      city: 'New York',
    },
    {
      id: 2,
      name: 'Bob',
      age: 25,
      networth: -10000,
      country: 'Canada',
      city: 'Toronto',
    },
  ],
  retrievedAt: '2024-08-09T12:00:00Z',
  lastModifiedAt: '2024-08-08T15:30:00Z',
}

export default mockData
