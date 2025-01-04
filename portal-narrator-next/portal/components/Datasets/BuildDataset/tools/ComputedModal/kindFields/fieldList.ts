import {
  KIND_BIN,
  KIND_CONCATENATE_STRING,
  KIND_CONCATENATE_STRING_MULTI_COLUMN,
  KIND_DATE_PART,
  KIND_DECIMATE_NUMBER,
  KIND_FREEHAND_FUNCTION,
  KIND_IFTTT,
  KIND_MATH_OPERATION,
  KIND_MATH_OPERATION_MULTI_COLUMN,
  KIND_MOVING_AVERAGE,
  KIND_PERCENT_TOTAL,
  KIND_REPLACE,
  KIND_ROW_NUMBER,
  KIND_RUNNING_TOTAL,
  KIND_STRING_BETWEEN,
  KIND_TIME_ADD,
  KIND_TIME_BETWEEN,
  KIND_TIME_TO_NOW,
  KIND_TIME_TRUNCATE,
} from '../computedConstants'
import Bin from './Bin'
import ConcatenateString from './ConcatenateString'
import ConcatenateStringMulti from './ConcatenateStringMulti'
import DecimateNumber from './DecimateNumber'
import FreehandFunction from './FreehandFunction'
import Ifttt from './Ifttt/Ifttt'
import MathOperation from './MathOperation'
import MathOperationMulti from './MathOperationMulti'
import MovingAverage from './MovingAverage'
import PercentTotal from './PercentTotal'
import ReplaceString from './ReplaceString'
import RowNumber from './RowNumber'
import RunningTotal from './RunningTotal'
import StringBetween from './StringBetween'
import TimeAdd from './TimeAdd'
import TimeBetween from './TimeBetween'
import TimeDatePart from './TimeDatePart'
import TimeToNow from './TimeToNow'
import TimeTruncate from './TimeTruncate'

export default {
  [KIND_TIME_ADD.kind]: TimeAdd,
  [KIND_TIME_BETWEEN.kind]: TimeBetween,
  [KIND_TIME_TO_NOW.kind]: TimeToNow,
  [KIND_TIME_TRUNCATE.kind]: TimeTruncate,
  [KIND_DATE_PART.kind]: TimeDatePart,
  [KIND_MATH_OPERATION.kind]: MathOperation,
  [KIND_MATH_OPERATION_MULTI_COLUMN.kind]: MathOperationMulti,
  [KIND_REPLACE.kind]: ReplaceString,
  [KIND_STRING_BETWEEN.kind]: StringBetween,
  [KIND_DECIMATE_NUMBER.kind]: DecimateNumber,
  [KIND_CONCATENATE_STRING.kind]: ConcatenateString,
  [KIND_CONCATENATE_STRING_MULTI_COLUMN.kind]: ConcatenateStringMulti,
  [KIND_ROW_NUMBER.kind]: RowNumber,
  [KIND_RUNNING_TOTAL.kind]: RunningTotal,
  [KIND_PERCENT_TOTAL.kind]: PercentTotal,
  [KIND_MOVING_AVERAGE.kind]: MovingAverage,
  [KIND_IFTTT.kind]: Ifttt,
  [KIND_BIN.kind]: Bin,
  [KIND_FREEHAND_FUNCTION.kind]: FreehandFunction,
}
