

import { findStatementAroundOffset, isLineInSqlBlock } from './functionHelpers';


describe("Statement around offset", () => {

  test ("single statement", () => {
    const query = "select\n*,\nfrom dw.warehouse\nlimit 10;"
    const expected = {
      startOffset: 0,
      endOffset: query.length
    }

    expect(findStatementAroundOffset(query, 0)).toEqual(expected);
    expect(findStatementAroundOffset(query, query.length - 1)).toEqual(expected);
    expect(findStatementAroundOffset(query, 12)).toEqual(expected);
  })


  test ("two statements", () => {
    const query = `select *
from pages;

select
  count(1),
  *
from dw.warehouse
limit 10;`

    const endOffset = 20 // end of select * from pages;

    const first = {
      startOffset: 0,
      endOffset: endOffset
    }

    const second = {
      startOffset: endOffset,
      endOffset: query.length
    }

    expect(query[endOffset - 1]).toEqual(';') // last offset is just after semicolon
    expect(findStatementAroundOffset(query, 0)).toEqual(first);
    expect(findStatementAroundOffset(query, 12)).toEqual(first);
    expect(findStatementAroundOffset(query, endOffset - 1)).toEqual(first);

    expect(findStatementAroundOffset(query, endOffset)).toEqual(second);
    expect(findStatementAroundOffset(query, query.length - 1)).toEqual(second);
  })


  test ("strings with semicolons", () => {

    const query = `select
'hello; nice' as greeting
from pages;

select
  count(1),
  'something;' as something
from dw.warehouse
limit 10;`


    const endOffset = 44 // end of from pages;

    const first = {
      startOffset: 0,
      endOffset: endOffset
    }

    const second = {
      startOffset: endOffset,
      endOffset: query.length
    }

    expect(findStatementAroundOffset(query, 5)).toEqual(first);
    expect(findStatementAroundOffset(query, 40)).toEqual(first);

    expect(findStatementAroundOffset(query, second.startOffset + 5)).toEqual(second);
    expect(findStatementAroundOffset(query, second.endOffset - 5)).toEqual(second);
  })


  test("no semicolon", () => {
    const query = `select * from dw.activity_stream
limit 10`
    expect(query[40]).toEqual('0')
    expect(findStatementAroundOffset(query, 2)).toEqual({startOffset: 0, endOffset: 41});
  });


  test("non sql strings return start and end", () => {
    expect(findStatementAroundOffset("hello", 2)).toEqual({startOffset: 0, endOffset: 5});
  });

  test ("just a semicolon", () => {
    expect(findStatementAroundOffset(";", 0)).toEqual({startOffset: 0, endOffset: 1});
  })

})

describe("isLineInSqlBlock", () => {
  test ("finds expected lines", () => {
    const value = "# markdown\n```sql\nselect *\nfrom\ndw.warehouse\n```\n# more markdown\nhello\n```\nsomething\n```sql\nselect"
    const expected = [3, 4, 5, 12]

    for (let lineNum of expected) {
      expect(isLineInSqlBlock(lineNum, value)).toEqual(true)
    }

    for (let lineNum of [1,6,7,9, 10, 11]) {
      expect(isLineInSqlBlock(lineNum, value)).toEqual(false)
    }
  })
})